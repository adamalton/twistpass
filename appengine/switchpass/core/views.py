from django.shortcuts import render


def home(request):
    """ Root of the site. """
    return render(request, "core/home.html", {})
