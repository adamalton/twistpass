from twistpass.site.settings import *

SESSION_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 2592000 #30 days
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_SSL_REDIRECT = True
CSRF_COOKIE_SECURE = True


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

# Remove unsafe-inline from CSP_STYLE_SRC. It's there in default to allow
# Django error pages in DEBUG mode render necessary styles
if "'unsafe-inline'" in CSP_STYLE_SRC:
    CSP_STYLE_SRC = list(CSP_STYLE_SRC)
    CSP_STYLE_SRC.remove("'unsafe-inline'")
    CSP_STYLE_SRC = tuple(CSP_STYLE_SRC)

# Add the cached template loader for the Django template system (not for Jinja)
for template in TEMPLATES:
    template['OPTIONS']['debug'] = False
    if template['BACKEND'] == 'django.template.backends.django.DjangoTemplates':
        # Wrap the normal loaders with the cached loader
        template['OPTIONS']['loaders'] = [
            ('django.template.loaders.cached.Loader', template['OPTIONS']['loaders'])
        ]
