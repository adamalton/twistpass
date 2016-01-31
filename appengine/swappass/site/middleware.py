from django.conf import settings
from django.http import HttpResponsePermanentRedirect


class DomainRedirectMiddlware(object):

	def process_request(self, request):
		redirect_to_domain = settings.DOMAIN_REDIRECTS.get(request.get_host())
		if redirect_to_domain:
			protocol = "https" if request.is_secure() else "http"
			url = "%s://%s%s" % (protocol, redirect_to_domain, request.get_full_path())
			return HttpResponsePermanentRedirect(url)
