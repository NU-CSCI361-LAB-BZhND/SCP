from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LinkViewSet, SupplierListView

router = DefaultRouter()
router.register(r'links', LinkViewSet, basename='link')

urlpatterns = [
    path('', include(router.urls)),
    path('suppliers/', SupplierListView.as_view(), name='supplier-list'),
]