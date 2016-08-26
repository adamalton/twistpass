# THIRD PARTY
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.cache import cache_page, cache_control


def no_op_decorator(*args, **kwargs):
    """ No-op replacement for any decorator. """
    def decorator(function):
        return function
    return decorator

if settings.DEBUG:
    cache_page = no_op_decorator
    cache_control = no_op_decorator


CACHE_TIME = 50 * 60


@cache_control(public=True)
@cache_page(CACHE_TIME)
def home(request):
    """ Root of the site. """
    return render(request, "core/home.html", {})


@cache_control(public=True)
@cache_page(CACHE_TIME)
def generator(request):
    """ The page with the actual password generator. """
    return render(request, "core/generator.html", {})


@cache_control(public=True)
@cache_page(CACHE_TIME)
def how_it_works(request):
    """ Page which explains how TwistPass works. """
    return render(request, "core/how_it_works.html", {})


@cache_control(public=True)
@cache_page(CACHE_TIME)
def feedback(request):
    """ Page that links to the Google Form where users can submit feedback. """
    return render(request, "core/feedback.html", {})


@cache_control(public=True)
@cache_page(CACHE_TIME)
def send_love(request):
    """ Page on whcih users can donate. """
    return render(request, "core/send_love.html", {})


@cache_control(public=True)
@cache_page(CACHE_TIME)
def tips(request):
    """ Tips for how to create a strong master password. """
    return render(request, "core/tips.html", {})


@cache_control(public=True)
@cache_page(CACHE_TIME)
def learn(request):
    """ Root page for the articles section of the site. """
    return render(request, "core/learn.html", {})


def keep_alive(request):
    """ Un-cached view which is called by the cron to keep the App Engine instance alive. """
    return HttpResponse("ok")
