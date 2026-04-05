from django.urls import path
from .views import AnalyzeView, CompareView

urlpatterns = [
    path('analyze/', AnalyzeView.as_view(), name='analyze'),
    path('compare/', CompareView.as_view(), name='compare'),
]