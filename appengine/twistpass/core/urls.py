from django.conf.urls import include, url

from twistpass.core import views

urlpatterns = [
    url(r'^$', views.home, name='home'),
    url(r'^generator/$', views.generator, name='generator'),
    url(r'^how-it-works/$', views.how_it_works, name='how_it_works'),

    url(r'^feedback/$', views.feedback, name='feedback'),
    url(r'^send-love/$', views.send_love, name='send_love'),
    url(r'^tips/$', views.tips, name='tips'),
    # url(r'^learn/$', 'learn', name='learn'),

    url(r'^keep-alive/$', views.keep_alive, name='keep_alive'),
]
