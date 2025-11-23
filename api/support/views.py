import csv
from django.http import HttpResponse
from rest_framework import viewsets, permissions, exceptions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view
from companies.models import Link, LinkStatus
from .models import Complaint, EscalationLevel, ChatMessage, ChatThread, ComplaintStatus
from .serializers import ComplaintSerializer, ComplaintUpdateSerializer, ChatThreadSerializer, ChatMessageSerializer

# Create your views here.

@extend_schema_view(
    create=extend_schema(summary="File a Complaint"),
    list=extend_schema(summary="List Complaints"),
    partial_update=extend_schema(summary="Resolve or Dismiss Complaint")
)
class ComplaintViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return ComplaintUpdateSerializer
        return ComplaintSerializer

    def get_queryset(self):
        user = self.request.user
        base_qs = Complaint.objects.filter(is_active=True)
        # Consumers see their own complaints
        if user.consumer:
            return base_qs.filter(created_by=user)
        # Suppliers see complaints linked to their orders
        elif user.supplier:
            return base_qs.filter(order__supplier=user.supplier)
        return Complaint.objects.none()

    def perform_create(self, serializer):
        if not self.request.user.consumer:
            raise exceptions.PermissionDenied("Only Consumers can file complaints.")
        serializer.save(created_by=self.request.user)

    @extend_schema(summary="Assign Complaint to Self")
    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        complaint = self.get_object()

        if not request.user.supplier:
            raise exceptions.PermissionDenied("Only Supplier staff can claim tickets.")

        complaint.assigned_to = request.user
        complaint.status = ComplaintStatus.IN_PROGRESS
        complaint.save()

        return Response({"status": "Assigned", "assigned_to": request.user.email})

    @extend_schema(summary="Escalate Complaint", request=None)
    @action(detail=True, methods=['post'], url_path='escalate')
    def escalate(self, request, pk=None):
        """
        Move the complaint to the next level.
        """
        complaint = self.get_object()

        if not request.user.supplier:
            raise exceptions.PermissionDenied("Only Supplier staff can escalate tickets.")

        current = complaint.escalation_level
        if current == EscalationLevel.SALES_REP:
            complaint.escalation_level = EscalationLevel.MANAGER
        elif current == EscalationLevel.MANAGER:
            complaint.escalation_level = EscalationLevel.OWNER
        else:
            return Response({"detail": "Already at highest escalation level."}, status=status.HTTP_400_BAD_REQUEST)

        complaint.save()
        return Response({"status": "Escalated", "level": complaint.escalation_level})

    @extend_schema(summary="Export Complaints to CSV")
    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """
        Download a CSV file of all visible complaints.
        """
        complaints = self.filter_queryset(self.get_queryset())

        # Create the Response object with CSV header
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="complaints_log.csv"'

        writer = csv.writer(response)
        # Header Rows
        writer.writerow(['ID', 'Date', 'Order ID', 'Subject', 'Status', 'Escalation Level', 'Created By'])

        # Data Rows
        for c in complaints:
            writer.writerow([
                c.id,
                c.created_at.strftime("%Y-%m-%d %H:%M"),
                c.order.id,
                c.subject,
                c.status,
                c.escalation_level,
                c.created_by.email
            ])

        return response

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


@extend_schema_view(
    list=extend_schema(summary="List Chat Threads"),
    retrieve=extend_schema(summary="Get Chat Details"),
    create=extend_schema(summary="Start a New Chat Thread")
)
class ChatThreadViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatThreadSerializer

    def get_queryset(self):
        user = self.request.user
        base_qs = ChatThread.objects.filter(is_active=True)
        if user.consumer:
            return base_qs.filter(consumer=user.consumer)
        elif user.supplier:
            return base_qs.filter(supplier=user.supplier)
        return ChatThread.objects.none()

    def perform_create(self, serializer):
        """
        Ensure a valid Link exists before starting a chat.
        """
        user = self.request.user

        supplier = serializer.validated_data.get('supplier')
        consumer = serializer.validated_data.get('consumer')

        # Auto fill the current user's company
        if user.consumer:
            consumer = user.consumer
        elif user.supplier:
            supplier = user.supplier

        # Check for Link
        has_link = Link.objects.filter(
            consumer=consumer,
            supplier=supplier,
            status=LinkStatus.ACCEPTED
        ).exists()

        if not has_link:
            raise exceptions.PermissionDenied("You must have an ACCEPTED link to chat.")

        serializer.save(consumer=consumer, supplier=supplier)

    @extend_schema(summary="Escalate Chat to Manager")
    @action(detail=True, methods=['post'])
    def escalate(self, request, pk=None):
        thread = self.get_object()

        if not request.user.supplier:
            raise exceptions.PermissionDenied("Only Supplier staff can escalate.")

        if thread.escalation_level == EscalationLevel.SALES_REP:
            thread.escalation_level = EscalationLevel.MANAGER
            thread.save()
            return Response({"status": "Escalated to Manager"})

        return Response({"detail": "Already escalated"}, status=status.HTTP_400_BAD_REQUEST)

@extend_schema_view(
    list=extend_schema(summary="List Messages in Thread"),
    create=extend_schema(summary="Send Message")
)
class ChatMessageViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        """
        Filter messages by thread_id passed in URL.
        """
        thread_id = self.kwargs.get('thread_pk')
        user = self.request.user

        # Verify user belongs to this thread
        queryset = ChatMessage.objects.none()
        if user.consumer:
            queryset = ChatMessage.objects.filter(thread_id=thread_id, thread__consumer=user.consumer)
        elif user.supplier:
            queryset = ChatMessage.objects.filter(thread_id=thread_id, thread__supplier=user.supplier)

        # Filter by since timestamp
        # GET /messages/?since=2025-11-22T10:00:00Z
        since = self.request.query_params.get('since')
        if since:
            queryset = queryset.filter(created_at__gt=since)

        return queryset

    def perform_create(self, serializer):
        thread_id = self.kwargs.get('thread_pk')
        try:
            thread = ChatThread.objects.get(id=thread_id)
        except ChatThread.DoesNotExist:
            raise exceptions.NotFound("Thread not found.")

        # Verify participation
        user = self.request.user
        if (user.consumer and thread.consumer != user.consumer) or (user.supplier and thread.supplier != user.supplier):
            raise exceptions.PermissionDenied("You are not part of this chat.")

        serializer.save(sender=user, thread=thread)

        # Update thread timestamp
        thread.save()

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

    @extend_schema(summary="Mark messages as Read")
    @action(detail=False, methods=['post'])
    def mark_read(self, request, thread_pk=None):
        """
        Marks all messages in this thread sent by the OTHER party as read.
        """
        if request.user.consumer:
            # Consumer reads Supplier messages
            ChatMessage.objects.filter(
                thread_id=thread_pk,
                sender__supplier__isnull=False,  # Sent by supplier
                is_read=False
            ).update(is_read=True)
        elif request.user.supplier:
            # Supplier reads Consumer messages
            ChatMessage.objects.filter(
                thread_id=thread_pk,
                sender__consumer__isnull=False,  # Sent by consumer
                is_read=False
            ).update(is_read=True)
        return Response({"status": "Messages marked as read"})
