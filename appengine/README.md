Twistpass - App Engine
=======================

This is the App Engine application which hosts the web version of [twistpass.com](https://twistpass.com).

It uses Django, but only for its template rendering, nothing else. It should probably be a static site, for speed.


## Installation

### Requirements:
* You'll need [gcloud](https://cloud.google.com/sdk/install) installed.
* You'll need python2.7 installed on your machine.

Run `bin/install_deps`.


## Local Development

`$ python2.7 manage.py runserver`


## Deployment

Run `bin/deploy.py`
