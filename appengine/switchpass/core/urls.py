from django.conf.urls import patterns, include, url

urlpatterns = patterns(
    'switchpass.core.views',
    url(r'^$', 'home', name='home'),
)
