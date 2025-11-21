from rest_framework.routers import DefaultRouter
from .views import ProductViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

# Only the router URLs — no project includes here
urlpatterns = router.urls