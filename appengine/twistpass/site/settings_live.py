from twistpass.site.settings import *

SESSION_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 2592000 #30 days
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_FRAME_DENY = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_SSL_REDIRECT = True


SECURE_REDIRECT_EXEMPT = [
    # App Engine doesn't use HTTPS internally, so the /_ah/.* URLs need to be exempt.
    # djangosecure compares these to request.path.lstrip("/"), hence the lack of preceding /
    r"^_ah/",
    r"^keep-alive/",
    r"^\.well-known/acme-challenge/",
]

SECURE_CHECKS += ["twistpass.site.checks.check_csp_sources_not_unsafe"]

DEBUG = False
TEMPLATE_DEBUG = False

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
    }
}
