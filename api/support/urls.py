from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComplaintViewSet, ChatThreadViewSet, ChatMessageViewSet

router = DefaultRouter()
router.register(r'complaints', ComplaintViewSet, basename='complaint')
router.register(r'chats', ChatThreadViewSet, basename='chat-thread')

urlpatterns = [
    path('', include(router.urls)),
    # Route for messages: /api/support/chats/{id}/messages/
    path('chats/<int:thread_pk>/messages/', ChatMessageViewSet.as_view({'get': 'list', 'post': 'create'}), name='chat-messages'),
    path('chats/<int:thread_pk>/messages/mark_read/', ChatMessageViewSet.as_view({
        'post': 'mark_read'
    }), name='chat-messages-mark-read'),
]