from django.conf.urls import patterns, include, url

urlpatterns = patterns(
    'switchpass.core.views',
    url(r'^$', 'home', name='home'),
    url(r'^how-it-works/$', 'how_it_works', name='how_it_works'),
)
