# ![Pinimatic](https://github.com/arctelix/pinimatic/raw/master/logo.png)


Pinimatic is a self-hosted, [Pinterest][0] inspired by [Wookmark][1] and
built on top of Django. Originally started as [Pinry][2], I greatly expanded upon the basic
Pinry it to make a fully functional, socially integrated, pinboard site.  Pinimatic is currently in 
Alpha/Development, some upgrades may be ugly/not work till v1.0.0 is release.

![Pinimatic Screenshot](https://github.com/arctelix/pinimatic/raw/master/screenshot.png)

## Getting Started

### 1) Have virtualenv and pip installed. You may also need to have the build dependencies for PIL installed.

Note: On windows you must install the appropriate windows binary version of Pillow for your system.
They can be found at: http://www.lfd.uci.edu/~gohlke/pythonlibs/
*Remember to change the install directory to your virtual environment. 

Note: On Ubuntu you can get the build deps by running
`sudo apt-get build-dep python-imaging`.

### 2) Installation:

    $ git clone git://github.com/overshard/Pinimatic.git
    $ cd Pinimatic
    $ virtualenv .
	$ Scripts\activate (activate your virtual env)
    $ pip install -r requirements.txt
    $ python manage.py syncdb
    $ python manage.py migrate
    $ python manage.py runserver

### 3) Pinimatic has three different customizable configurations:

### Development

Pinimatic is configured out of the box to run on django's built in development server on port 5000.
You may change the port in the settings.
- To enable sending email set local environment variables: EMAIL_HOST_PASSWORD,EMAIL_HOST_USER

### Production

Pinimatic is configured to run on Heroku with Gunicorn in the production environment.
You must configure heroku as follows:
- Create a Heroku account and add postgreSQL to your account.
- Create amazon S3 account and set up a bucket.
- Set Heroku env variable RACK_ENV = production
- Set Heroku env variable SECRET_KEY = any random string
- Set Heroku env variables for the database: DB_USER, DB_PASSWORD, DB_NAME
- Set Heroku env variables for email: EMAIL_HOST_PASSWORD,EMAIL_HOST_USER
  according to your email smtp server.
- set Heroku env variables AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME
  according to your amazon S3 bucket.

### Staging
Pinimatic is configured to run on Heroku with the built in development server in the 
staging environment. You must configure heroku the same as above with the following changes:
- Set Heroku env variable RACK_ENV = staging



### Quick Settings

There are a few settings provided specific to Pinimatic that allow you to get some
of the most requested functionality easily. (Pinimatic/settings/__init__.py)

 + **SITE_NAME**: For quickly changing the name Pinimatic to something you prefer.
 + **ALLOW_NEW_REGISTRATIONS**: Set to False to prevent people from registering.
 + **PUBLIC**: Set to False to require people to register before viewing pins.
   (Note: Setting PUBLIC to False does still allow registrations. Make sure
          both PUBLIC and the previous setting are set to False to prevent
          all public access.)
 + **INVITE_MODE**: Set to true to allow new registrations by invitation only.
   See https://github.com/arctelix/django-invitation.git for more information on invitation settings.
 + **ALLAUTH**: Many settings available for customization of login and signup.
   See https://github.com/arctelix/django-allauth.git for more information on allauth settings.
 + **EAMIL**: Configure these settings as per your email smtp server.
   
## Current Pin Features
  
### Current Pin Features
 + Pin Tagging
 + User groups
 + Filter pin views
 + User profiles
 + Add images via Bookmarklet
 + Add images via Upload
 + Add images via URL
 + Delete & Edit Pins
 + Favorite / Follow pins
 + Follow users
 + Re-Pining
 + Comment on pins
 
### Current User Account Features
 + User contact form for feedback & support
 + User profile pages with stats
 + Support for multiple Social Connections 
 + Support for multiple Email Addresses with verification & primary setting 

### Current Admin Features 
 + Local User Accounts & Social Account Connections
 + Invitation Only Mode for new registrations
 + Block all new registrations even with valid invitations
 + Send Bulk email to users via admin actions in user model
 + Send Bulk invitations to a list of email addresses (specific to recipient)
 + Generate Bulk invitation codes with specific number of uses
 + Superusers have full control over all users pins for easy admin.
 
### Roadmap
 + User Boards
 + Non-image URL pinning


## License (Simplified BSD)

Copyright (c) Simplex Studio (arctelix)
Copyright (c) Isaac Bythewood

All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


[0]: http://pinterest.com/
[1]: http://www.wookmark.com/
[2]: https://github.com/overshard/pinry