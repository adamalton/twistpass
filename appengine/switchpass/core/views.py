from django.shortcuts import render


def home(request):
    """ Root of the site. """
    return render(request, "core/home.html", {})


def how_it_works(request):
    """ Page which explains how Switchpass works. """
    return render(request, "core/how_it_works.html", {})
