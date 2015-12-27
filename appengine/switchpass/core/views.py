from django.shortcuts import render
from django.views.decorators.cache import cache_page


@cache_page(60 * 60)
def home(request):
    """ Root of the site. """
    return render(request, "core/home.html", {})


@cache_page(60 * 60)
def generator(request):
    """ The page with the actual password generator. """
    print ""
    print "Chicken"
    print ""
    return render(request, "core/generator.html", {})


@cache_page(60 * 60)
def how_it_works(request):
    """ Page which explains how Switchpass works. """
    return render(request, "core/how_it_works.html", {})
