# THIRD PARTY
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.cache import cache_page


def cache_page_bypass(*args, **kwargs):
    """ No-op replacement for Django's @cache_page decorator. """
    def decorator(function):
        return function
    return decorator

if settings.DEBUG:
    cache_page = cache_page_bypass


@cache_page(60 * 60)
def home(request):
    """ Root of the site. """
    return render(request, "core/home.html", {})


@cache_page(60 * 60)
def generator(request):
    """ The page with the actual password generator. """
    return render(request, "core/generator.html", {})


@cache_page(60 * 60)
def how_it_works(request):
    """ Page which explains how SwapPass works. """
    return render(request, "core/how_it_works.html", {})


@cache_page(60 * 60)
def feedback(request):
    """ Page that links to the Google Form where users can submit feedback. """
    return render(request, "core/feedback.html", {})


@cache_page(60 * 60)
def tips(request):
    """ Tips for how to create a strong master password. """
    return render(request, "core/tips.html", {})


@cache_page(60 * 60)
def faq(request):
    return render(request, "core/faq.html", {})


@cache_page(60 * 60)
def learn(request):
    """ Root page for the articles section of the site. """
    return render(request, "core/learn.html", {})


def keep_alive(request):
    """ Un-cached view which is called by the cron to keep the App Engine instance alive. """
    return HttpResponse("ok")
