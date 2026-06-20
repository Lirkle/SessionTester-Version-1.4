window.QUIZ_BANKS = window.QUIZ_BANKS || {};

window.QUIZ_BANKS.pm07_content_management_systems = {
  raw: `
1. Which command is used to create a new virtual environment in Python 3?
A) python3 -m venv myenv
B) python3 --create-env myenv
C) pip install virtualenv myenv
D) python3 -m env create myenv
E) virtualenv --python3 myenv
2. What is the correct way to activate a virtual environment on Linux or macOS?
A) source myenv/bin/activate
B) myenv/Scripts/activate
C) activate myenv
D) python3 myenv/activate
E) venv activate myenv
3. Which tool is used to install Python packages from the Python Package Index?
A) pip
B) npm
C) conda
D) gem
E) brew
4. What command installs Django into the currently active virtual environment?
A) pip install django
B) python install django
C) pip get django
D) django-admin install
E) pip add django
5. Which command creates a new Django project named 'mysite'?
A) django-admin startproject mysite
B) django-admin createproject mysite
C) python manage.py startproject mysite
D) pip start mysite
E) django startproject mysite
6. Which command creates a new Django application named 'blog' inside an existing project?
A) python manage.py startapp blog
B) django-admin startapp blog
C) python manage.py createapp blog
D) pip install blog
E) python manage.py newapp blog
7. Which file in a Django project contains the global configuration settings?
A) settings.py
B) config.py
C) urls.py
D) manage.py
E) wsgi.py
8. Which command starts the Django built-in development server?
A) python manage.py runserver
B) python manage.py startserver
C) django-admin runserver
D) python manage.py serve
E) python manage.py start
9. What is the default port on which the Django development server runs?
A) 8000
B) 8080
C) 3000
D) 5000
E) 80
10. Which setting in Django's settings.py specifies the list of installed applications?
A) INSTALLED_APPS
B) APPS
C) APPLICATIONS
D) DJANGO_APPS
E) APP_LIST
11. What does the DATABASES setting in Django's settings.py configure?
A) Database connection parameters for the project
B) The list of installed Python packages
C) The allowed hostnames for the server
D) The static files directory
E) The URL routing configuration
12. Which database engine string is used in Django settings to configure SQLite?
A) django.db.backends.sqlite3
B) django.db.backends.mysql
C) django.db.backends.postgresql
D) sqlite.backends.django3
E) db.sqlite3.backend
13. What is the purpose of the manage.py file in a Django project?
A) A command-line utility for interacting with the Django project
B) The main entry point for serving production traffic
C) A file that stores database credentials
D) A template configuration file for URLs
E) A file that lists all installed packages
14. Which Python keyword is used to define a function?
A) def
B) func
C) function
D) define
E) lambda
15. What is the correct syntax to define a variable x with value 10 in Python?
A) x = 10
B) int x = 10
C) var x = 10
D) x := 10;
E) let x = 10
16. Which of the following is a valid Python string data type literal?
A) 'Hello, World!'
B) Hello, World!
C) String(Hello)
D) str[Hello]
E) #Hello, World#
17. What data type does Python use to represent whole numbers?
A) int
B) integer
C) long
D) num
E) whole
18. Which Python data type represents True or False values?
A) bool
B) boolean
C) bit
D) flag
E) binary
19. What is the output of type(3.14) in Python?
A) <class 'float'>
B) <class 'int'>
C) <class 'double'>
D) <class 'decimal'>
E) <class 'number'>
20. Which Python statement is used for conditional branching?
A) if
B) when
C) case
D) switch
E) check
21. What keyword follows the condition in a Python if-else structure?
A) else
B) otherwise
C) default
D) or
E) then
22. Which loop in Python iterates over items in a sequence?
A) for
B) foreach
C) loop
D) iterate
E) each
23. What keyword is used to exit a loop prematurely in Python?
A) break
B) exit
C) stop
D) end
E) return
24. Which keyword skips the rest of the current loop iteration and moves to the next?
A) continue
B) skip
C) pass
D) next
E) jump
25. What does the range(5) function produce when used in a for loop?
A) Integers from 0 to 4
B) Integers from 1 to 5
C) Integers from 0 to 5
D) Integers from 1 to 4
E) A list [0,1,2,3,4,5]
26. How do you create a list in Python containing elements 1, 2, and 3?
A) [1, 2, 3]
B) {1, 2, 3}
C) (1, 2, 3)
D) list(1, 2, 3)
E) <1, 2, 3>
27. Which Python collection type is ordered, mutable, and allows duplicate elements?
A) list
B) tuple
C) set
D) dict
E) frozenset
28. Which Python collection type is ordered and immutable?
A) tuple
B) list
C) set
D) dict
E) array
29. Which Python collection type stores unique, unordered elements?
A) set
B) list
C) tuple
D) dict
E) array
30. Which Python collection type maps unique keys to values?
A) dict
B) list
C) set
D) tuple
E) map
31. How do you access the first element of a Python list named 'items'?
A) items[0]
B) items[1]
C) items.first()
D) items.get(0)
E) items(0)
32. What method adds an element to the end of a Python list?
A) append()
B) add()
C) insert()
D) push()
E) extend()
33. How do you retrieve a value from a Python dictionary 'data' using key 'name'?
A) data['name']
B) data.name
C) data(name)
D) data.get_key('name')
E) data[name]
34. Which built-in Python function returns the number of items in a collection?
A) len()
B) count()
C) size()
D) length()
E) num()
35. What is the correct way to define a class named 'Animal' in Python?
A) class Animal:
B) Class Animal:
C) def Animal():
D) class Animal{}
E) object Animal:
36. Which method in a Python class is automatically called when a new object is created?
A) __init__
B) __new__
C) __create__
D) __start__
E) __construct__
37. What is the first parameter of an instance method in a Python class conventionally named?
A) self
B) this
C) me
D) instance
E) cls
38. Which OOP principle restricts direct access to some of an object's components?
A) Encapsulation
B) Inheritance
C) Polymorphism
D) Abstraction
E) Composition
39. Which OOP principle allows a new class to acquire properties and methods of an existing class?
A) Inheritance
B) Encapsulation
C) Polymorphism
D) Abstraction
E) Overloading
40. Which OOP principle allows different classes to be treated as instances of the same parent class through a shared interface?
A) Polymorphism
B) Encapsulation
C) Inheritance
D) Abstraction
E) Composition
41. How do you indicate that class 'Dog' inherits from class 'Animal' in Python?
A) class Dog(Animal):
B) class Dog extends Animal:
C) class Dog inherits Animal:
D) Dog = Animal.subclass()
E) class Dog: inherits Animal
42. What does the super() function do in a Python subclass?
A) Calls a method from the parent class
B) Deletes the parent class instance
C) Creates a new superclass
D) Returns the class hierarchy
E) Prevents method overriding
43. Which term describes defining a method in a subclass with the same name as in its parent class?
A) Method overriding
B) Method overloading
C) Method hiding
D) Method chaining
E) Method delegation
44. What is an instance of a class in OOP terminology?
A) An object
B) A method
C) A module
D) A function
E) An attribute
45. Which Python keyword is used to create a class attribute that is shared among all instances?
A) A variable defined directly inside the class body but outside methods
B) A variable defined inside __init__ with self
C) A variable defined inside a method without self
D) A variable prefixed with __class__
E) A variable decorated with @staticmethod
46. Which file lists the Python packages required by a project for reproducibility?
A) requirements.txt
B) packages.json
C) setup.cfg
D) Pipfile.lock
E) dependencies.py
47. What command generates a requirements.txt file from the current virtual environment?
A) pip freeze > requirements.txt
B) pip list > requirements.txt
C) pip export > requirements.txt
D) pip save > requirements.txt
E) pip dump > requirements.txt
48. Which Python statement is used to import a module?
A) import
B) include
C) require
D) use
E) load
49. What is the correct way to import only the os module's path submodule?
A) from os import path
B) import os.path only
C) include os.path
D) require os import path
E) from os.path import
50. Which Django file in a project is responsible for URL routing?
A) urls.py
B) routes.py
C) paths.py
D) views.py
E) settings.py
51. What is the purpose of the wsgi.py file generated by Django?
A) Provides an entry point for WSGI-compatible web servers
B) Configures the database settings
C) Defines URL patterns for the application
D) Stores static files configuration
E) Manages Django admin authentication
52. Which Django setting must include your domain or IP to allow access during development?
A) ALLOWED_HOSTS
B) ALLOWED_DOMAINS
C) TRUSTED_HOSTS
D) HOST_WHITELIST
E) VALID_HOSTS
53. What value is typically set for ALLOWED_HOSTS during local development?
A) ['*'] or ['localhost', '127.0.0.1']
B) ['production.com']
C) ['0.0.0.0']
D) ['localhost:8000']
E) ['any']
54. Which command applies pending database migrations in a Django project?
A) python manage.py migrate
B) python manage.py syncdb
C) python manage.py apply
D) python manage.py update
E) python manage.py db
55. Which command creates migration files based on changes to Django models?
A) python manage.py makemigrations
B) python manage.py createmigrations
C) python manage.py migrations
D) python manage.py newmigration
E) python manage.py migrate --create
56. What does a Django migration file describe?
A) Changes to the database schema over time
B) The URL routing configuration
C) The HTML templates structure
D) The list of installed apps
E) The server startup configuration
57. Which built-in Django app provides an automatic administrative interface?
A) django.contrib.admin
B) django.contrib.auth
C) django.contrib.sessions
D) django.contrib.messages
E) django.contrib.staticfiles
58. What is a CMS in the context of web development?
A) A system for creating, managing, and publishing digital content without deep coding
B) A tool for compiling and minifying CSS and JavaScript
C) A version control system for web projects
D) A Python library for database ORM
E) A web server configuration management tool
59. Which of the following is a popular CMS built on the Django framework?
A) Wagtail
B) WordPress
C) Joomla
D) Drupal
E) Ghost
60. What is the purpose of Django's ORM (Object-Relational Mapper)?
A) To interact with the database using Python objects instead of raw SQL
B) To render HTML templates from Python dictionaries
C) To manage URL routing in a Django project
D) To serve static files during development
E) To handle user authentication and permissions
61. What Python statement defines a string that spans multiple lines?
A) Triple quotes: '''text''' or """text"""
B) Multi(text)
C) string.multiline('text')
D) text = 'line1\\nline2'
E) \\ntext\\n
62. What does the print() function do in Python?
A) Outputs text to the standard output (console)
B) Writes data to a file
C) Returns a value from a function
D) Formats a string for display
E) Sends data to a web server
63. Which Python function converts a string to an integer?
A) int()
B) str_to_int()
C) convert()
D) integer()
E) parse_int()
64. What is the result of 7 // 2 in Python?
A) 3
B) 3.5
C) 4
D) 2
E) 1
65. Which operator gives the remainder of a division in Python?
A) %
B) //
C) /
D) rem
E) mod
66. What does the is operator check in Python?
A) Whether two variables reference the same object in memory
B) Whether two variables have equal values
C) Whether a variable is of a specific type
D) Whether a variable exists in the current scope
E) Whether two strings are identical characters
67. Which Python keyword defines an anonymous (lambda) function?
A) lambda
B) anon
C) func
D) inline
E) arrow
68. What is the correct way to call a function named 'greet' with argument 'Alice' in Python?
A) greet('Alice')
B) call greet('Alice')
C) greet Alice
D) invoke greet('Alice')
E) run greet with 'Alice'
69. Which of the following correctly defines a function with a default parameter value?
A) def greet(name='World'):
B) def greet(name=:'World'):
C) def greet(name default 'World'):
D) def greet('World' = name):
E) def greet(name, default='World'):
70. What does a function return if it has no explicit return statement?
A) None
B) 0
C) False
D) An empty string
E) An error
71. Which statement correctly checks if variable x is greater than 10 AND less than 20 in Python?
A) if x > 10 and x < 20:
B) if x > 10 && x < 20:
C) if x > 10 & x < 20:
D) if (x > 10) AND (x < 20):
E) if x in range(11, 20):
72. What is the purpose of the __str__ method in a Python class?
A) Returns a human-readable string representation of the object
B) Initializes the object when created
C) Compares two objects for equality
D) Deletes the object from memory
E) Converts the object to an integer
73. Which Python concept allows hiding internal implementation details of a class?
A) Encapsulation
B) Polymorphism
C) Inheritance
D) Composition
E) Abstraction
74. Which Django component handles the logic of processing HTTP requests and returning responses?
A) Views
B) Models
C) Templates
D) Migrations
E) Signals
75. What is the MVT design pattern used by Django?
A) Model-View-Template
B) Model-View-Template-Toggle
C) Module-View-Template
D) Model-Variable-Template
E) Main-View-Template
76. Which Django file defines the data structure (schema) of your database tables as Python classes?
A) models.py
B) schema.py
C) database.py
D) tables.py
E) fields.py
77. What is the role of templates in a Django application?
A) HTML files that define how data is presented to the user
B) Python files that process HTTP requests
C) Configuration files for URL routing
D) Files that define database schema
E) Scripts that run database migrations
78. What command is used to check the installed version of Django?
A) python -m django --version
B) django-admin version
C) pip show version django
D) django --check-version
E) python manage.py version
79. Which Python built-in function returns a list of names in the current local scope or a module?
A) dir()
B) list()
C) vars()
D) names()
E) scope()
80. Which Python exception is raised when you try to access a dictionary key that does not exist?
A) KeyError
B) IndexError
C) ValueError
D) AttributeError
E) NameError
81. Which Python statement is used to handle exceptions?
A) try...except
B) catch...error
C) on error
D) if error
E) handle...exception
82. What Django setting specifies the directory where Django looks for HTML templates?
A) TEMPLATES (specifically the DIRS key)
B) TEMPLATE_DIR
C) HTML_DIR
D) STATIC_ROOT
E) MEDIA_ROOT
83. Which Django setting controls the location of static files (CSS, JS, images)?
A) STATICFILES_DIRS and STATIC_URL
B) MEDIA_URL and MEDIA_ROOT
C) STATIC_FILES
D) TEMPLATE_STATIC
E) ASSET_ROOT
84. What Python keyword is used to define a class method that receives the class as the first argument?
A) @classmethod with cls parameter
B) @staticmethod with cls parameter
C) def with class parameter
D) @method with self parameter
E) classdef with cls parameter
85. Which decorator marks a method so it receives no implicit first argument (neither self nor cls)?
A) @staticmethod
B) @classmethod
C) @property
D) @abstractmethod
E) @method
86. Which command checks for any configuration problems in a Django project?
A) python manage.py check
B) python manage.py validate
C) python manage.py test
D) python manage.py inspect
E) python manage.py doctor
87. What is the correct file extension for Python source code files?
A) .py
B) .python
C) .pt
D) .pyn
E) .pyc
88. Which of the following correctly demonstrates Python's list comprehension to create a list of squares from 1 to 5?
A) [x**2 for x in range(1, 6)]
B) [x^2 for x in range(1, 6)]
C) list(x*x, range(1, 6))
D) {x**2 for x in range(1, 5)}
E) [x**2 in range(1, 6)]
89. What is the purpose of the SECRET_KEY setting in Django's settings.py?
A) Provides cryptographic signing for sessions, cookies, and tokens
B) Sets the administrator password
C) Defines the database encryption key
D) Stores the API key for third-party services
E) Controls access to the Django admin panel
90. Which Python module from the standard library provides functions for interacting with the operating system?
A) os
B) sys
C) io
D) platform
E) subprocess
91. What does DEBUG = True in Django's settings.py enable?
A) Detailed error pages with tracebacks during development
B) Automatic database migrations on server start
C) Verbose SQL query logging to the console
D) Automatic reload of static files
E) Live code reloading in templates
92. Why should DEBUG = False be set in a Django production environment?
A) To prevent exposing sensitive error details and source code to users
B) To speed up database queries significantly
C) To disable the Django admin interface
D) To enable caching of all views
E) To activate HTTPS automatically
93. Which character begins a comment in Python?
A) #
B) //
C) --
D) /*
E) !
94. What does the while loop do in Python?
A) Repeatedly executes a block of code as long as a condition remains True
B) Iterates over all items in a collection exactly once
C) Runs a block of code a fixed number of times
D) Waits for a user input before executing
E) Checks a condition and runs the block exactly once if True
95. Which Django setting must be set to False in a production environment to prevent exposing sensitive error details?
A) ALLOWED_HOSTS
B) DEBUG
C) SECRET_KEY
D) SECURE_SSL_REDIRECT
E) SESSION_COOKIE_SECURE
96. What is the primary purpose of the Django SECRET_KEY setting?
A) To encrypt database passwords
B) To sign cookies, sessions, and CSRF tokens
C) To store the admin user password
D) To define the allowed HTTP methods
E) To configure the database connection
97. Which HTTP header does Django's CSRF protection mechanism use to validate form submissions?
A) X-Frame-Options
B) Content-Security-Policy
C) X-CSRFToken
D) Authorization
E) X-XSS-Protection
98. In Django, what is the correct way to mark a view as exempt from CSRF verification?
A) Apply the @csrf_required decorator
B) Apply the @csrf_exempt decorator
C) Set CSRF_COOKIE_SECURE = False in settings
D) Add 'csrf_off': True to the URL pattern
E) Remove CsrfViewMiddleware from MIDDLEWARE
99. What does the ALLOWED_HOSTS setting in Django control?
A) Which IP addresses can connect to the database
B) Which domains/hostnames are permitted to serve the application
C) Which users can log in to the admin panel
D) Which HTTP methods are allowed on views
E) Which middleware classes are active
100. Which Django model field type is used to store a user's hashed password?
A) TextField
B) CharField
C) PasswordField
D) BinaryField
E) EmailField
101. By default, what hashing algorithm does Django use for storing user passwords?
A) MD5
B) SHA-1
C) PBKDF2 with SHA-256
D) Bcrypt
E) Argon2
102. What is the purpose of a 'salt' in password hashing?
A) To speed up the hashing process
B) To prevent rainbow table attacks by adding randomness
C) To allow reversible decryption of passwords
D) To compress the password before storage
E) To ensure passwords are at least 8 characters long
103. Which Django built-in class handles user authentication and session management?
A) django.contrib.admin.ModelAdmin
B) django.contrib.auth.backends.ModelBackend
C) django.middleware.security.SecurityMiddleware
D) django.contrib.sessions.backends.db
E) django.contrib.staticfiles.storage.StaticFilesStorage
104. What does the @login_required decorator do in a Django view?
A) Hashes the user's password before processing the request
B) Redirects unauthenticated users to the login page
C) Logs every request to the database
D) Grants superuser access to the view
E) Validates the CSRF token automatically
105. Which setting enables automatic redirection of HTTP requests to HTTPS in Django?
A) SECURE_SSL_REDIRECT
B) ALLOWED_HOSTS
C) SESSION_COOKIE_SECURE
D) CSRF_COOKIE_SECURE
E) X_FRAME_OPTIONS
106. What is Cross-Site Request Forgery (CSRF)?
A) An attack that injects malicious SQL into database queries
B) An attack that tricks a user's browser into making unwanted requests
C) An attack that intercepts network traffic between client and server
D) An attack that exploits directory traversal vulnerabilities
E) An attack that floods a server with traffic
107. What is Cross-Site Scripting (XSS)?
A) An attack that forges HTTP requests from a trusted user
B) An attack that injects client-side scripts into web pages viewed by others
C) An attack that exploits weak password hashing
D) An attack that manipulates database queries via user input
E) An attack that intercepts SSL/TLS handshakes
108. How does Django's template engine help prevent XSS attacks by default?
A) It encrypts all template variables before rendering
B) It automatically escapes HTML special characters in template variables
C) It strips all JavaScript from user input
D) It validates all variables against a whitelist
E) It converts all output to plain text
109. Which Django template tag is used to disable automatic HTML escaping for a specific variable?
A) {% safe %}
B) {% raw %}
C) {{ variable|safe }}
D) {% noescape %}
E) {{ variable|escape }}
110. What is SQL injection?
A) Embedding SQL queries inside CSS stylesheets
B) Inserting malicious SQL code into input fields to manipulate database queries
C) Uploading SQL dump files to a web server
D) Encrypting database queries for secure transmission
E) Using SQL to generate CSRF tokens
111. How does Django's ORM (Object-Relational Mapper) protect against SQL injection?
A) It disables raw SQL queries entirely
B) It uses parameterized queries that separate data from SQL code
C) It encrypts all SQL statements before execution
D) It validates SQL syntax before running queries
E) It stores queries in a sandboxed memory space
112. When using Django's raw() method, what is the correct way to pass user-supplied values safely?
A) Concatenate the value directly into the query string
B) Use Python's % string formatting operator
C) Pass values as a list of parameters to the params argument
D) Wrap the value in double quotes in the SQL string
E) Use the str() function to convert the value before insertion
113. Which Django middleware adds several security-related HTTP headers automatically?
A) django.middleware.common.CommonMiddleware
B) django.middleware.security.SecurityMiddleware
C) django.contrib.auth.middleware.AuthenticationMiddleware
D) django.middleware.csrf.CsrfViewMiddleware
E) django.contrib.sessions.middleware.SessionMiddleware
114. What does the X-Frame-Options HTTP header do?
A) Prevents the browser from loading external JavaScript files
B) Controls whether the page can be embedded in an iframe on another site
C) Forces the browser to use HTTPS for all subsequent requests
D) Enables HTTP Strict Transport Security
E) Specifies which content types the browser should render
115. What HTTP header instructs the browser to only access the site over HTTPS for a defined period?
A) X-Frame-Options
B) Content-Security-Policy
C) Strict-Transport-Security
D) X-Content-Type-Options
E) Referrer-Policy
116. What is the purpose of the Content-Security-Policy (CSP) HTTP header?
A) To define which database servers the application can connect to
B) To restrict which sources of content the browser is allowed to load
C) To encrypt the HTTP response body
D) To set the session cookie lifetime
E) To specify which HTTP methods are permitted
117. Which Django setting makes session cookies only sent over HTTPS connections?
A) CSRF_COOKIE_SECURE
B) SESSION_COOKIE_SECURE
C) SECURE_SSL_REDIRECT
D) SESSION_COOKIE_HTTPONLY
E) SECURE_HSTS_SECONDS
118. What does setting SESSION_COOKIE_HTTPONLY = True accomplish in Django?
A) Prevents session cookies from being transmitted over HTTP
B) Prevents JavaScript from accessing the session cookie
C) Forces session data to be stored in the database
D) Encrypts the session cookie value
E) Sets the session cookie expiry to one hour
119. In Django's permission system, what does the 'add' permission on a model allow a user to do?
A) View all instances of the model
B) Delete any instance of the model
C) Create new instances of the model
D) Edit any instance of the model
E) Export the model's data to CSV
120. What is the difference between a Django 'user' and a Django 'superuser'?
A) A superuser must use two-factor authentication
B) A superuser has all permissions without explicit assignment
C) A user can access the admin panel; a superuser cannot
D) A superuser has read-only access by default
E) A user can create other superusers; a superuser cannot
121. How are permissions assigned to multiple users efficiently in Django?
A) By editing each user record individually in the database
B) By creating a Group and assigning permissions to the Group
C) By modifying the Django source code
D) By writing a custom authentication backend
E) By using raw SQL UPDATE statements on the auth_permission table
122. What Django class is used to create custom permission checks in class-based views?
A) LoginRequiredMixin
B) PermissionRequiredMixin
C) UserPassesTestMixin
D) AccessControlMixin
E) StaffRequiredMixin
123. Which OWASP Top 10 category describes insufficient logging and monitoring of security events?
A) Broken Access Control
B) Security Misconfiguration
C) Injection
D) Security Logging and Monitoring Failures
E) Vulnerable and Outdated Components
124. What is 'Broken Access Control' as defined in the OWASP Top 10?
A) Weak password hashing algorithms being used
B) Users being able to act outside their intended permissions
C) Unencrypted data being sent over the network
D) Outdated third-party libraries with known vulnerabilities
E) Missing CSRF tokens on forms
125. What OWASP vulnerability occurs when an application includes a library with a known security flaw?
A) Broken Authentication
B) Cryptographic Failures
C) Vulnerable and Outdated Components
D) Server-Side Request Forgery
E) Broken Access Control
126. Which practice helps mitigate the risk of using outdated Django packages?
A) Disabling automatic updates in pip
B) Regularly running pip list --outdated and updating packages
C) Pinning all packages to their initial installation versions permanently
D) Removing all third-party packages from the project
E) Using only packages from the Django official repository
127. What is the role of HTTPS/SSL in web application security?
A) To hash passwords before they are stored in the database
B) To encrypt data transmitted between the client and the server
C) To prevent SQL injection attacks on the database
D) To validate user input on the server side
E) To manage user session tokens
128. What is a man-in-the-middle (MITM) attack?
A) An attack where a database query is altered by user input
B) An attack where a third party secretly intercepts communication between two parties
C) An attack that exploits missing CSRF tokens
D) An attack that floods a server with login attempts
E) An attack that injects scripts into web pages
129. How does HSTS (HTTP Strict Transport Security) protect a web application?
A) It prevents cross-site scripting on all pages
B) It forces browsers to use HTTPS for all future requests to the domain
C) It encrypts session cookies stored on the client
D) It blocks SQL injection attempts at the network level
E) It validates the server's SSL certificate on every request
130. Which Django setting configures the duration of HSTS in seconds?
A) SECURE_BROWSER_XSS_FILTER
B) SECURE_CONTENT_TYPE_NOSNIFF
C) SECURE_HSTS_SECONDS
D) SESSION_COOKIE_AGE
E) SECURE_SSL_REDIRECT
131. What is the purpose of the SECURE_CONTENT_TYPE_NOSNIFF setting in Django?
A) It prevents the browser from caching sensitive pages
B) It stops the browser from guessing (sniffing) the MIME type of responses
C) It disables rendering of HTML in API responses
D) It forces all responses to use UTF-8 encoding
E) It blocks requests with missing Content-Type headers
132. In Django, which middleware must appear first in the MIDDLEWARE list for it to apply security headers correctly?
A) django.middleware.csrf.CsrfViewMiddleware
B) django.contrib.auth.middleware.AuthenticationMiddleware
C) django.middleware.security.SecurityMiddleware
D) django.contrib.sessions.middleware.SessionMiddleware
E) django.middleware.clickjacking.XFrameOptionsMiddleware
133. What does the django.middleware.clickjacking.XFrameOptionsMiddleware do?
A) Prevents CSRF attacks on AJAX requests
B) Adds the X-Frame-Options header to responses to prevent clickjacking
C) Encrypts all outbound HTTP responses
D) Blocks requests containing SQL injection patterns
E) Validates the Content-Security-Policy on each response
134. What is clickjacking?
A) Injecting malicious JavaScript into a trusted website
B) Tricking a user into clicking on something different from what they perceive
C) Intercepting login credentials over an unencrypted connection
D) Exploiting a vulnerable third-party package
E) Performing brute-force attacks on login forms
135. Which Django setting controls the age of session cookies in seconds?
A) SESSION_COOKIE_HTTPONLY
B) SESSION_EXPIRE_AT_BROWSER_CLOSE
C) SESSION_COOKIE_AGE
D) SESSION_COOKIE_SECURE
E) SESSION_SAVE_EVERY_REQUEST
136. What happens when SESSION_EXPIRE_AT_BROWSER_CLOSE is set to True in Django?
A) Sessions expire after 30 minutes of inactivity
B) Sessions are deleted when the user closes the browser
C) Sessions are stored only in memory and not in the database
D) Sessions expire exactly one hour after creation
E) Sessions are encrypted with the SECRET_KEY
137. Which Django built-in validator enforces a minimum password length?
A) UserAttributeSimilarityValidator
B) CommonPasswordValidator
C) NumericPasswordValidator
D) MinimumLengthValidator
E) AlphanumericPasswordValidator
138. What does the CommonPasswordValidator in Django check?
A) Whether the password contains at least one uppercase letter
B) Whether the password is too similar to the username
C) Whether the password appears in a list of common passwords
D) Whether the password is at least 12 characters long
E) Whether the password contains special characters
139. Where are Django's password validators configured?
A) In the urls.py file
B) In the AUTH_PASSWORD_VALIDATORS setting in settings.py
C) In the User model's Meta class
D) In the login view function
E) In the admin.py registration
140. What is brute-force attack protection in the context of web authentication?
A) Hashing passwords with a slow algorithm to slow attackers
B) Limiting the number of login attempts to prevent systematic password guessing
C) Encrypting the login form using SSL
D) Requiring users to change passwords every 30 days
E) Storing failed login attempts in a separate database
141. Which third-party Django package is commonly used to add rate limiting and account lockout after failed login attempts?
A) django-allauth
B) django-axes
C) django-guardian
D) django-crispy-forms
E) django-rest-framework
142. What is two-factor authentication (2FA)?
A) Using two different passwords for the same account
B) Requiring a second verification step in addition to the password
C) Encrypting login data with two different keys
D) Running two separate authentication servers
E) Logging in from two approved devices simultaneously
143. What is the purpose of Django's check_password() function?
A) To verify that a raw password matches a stored hashed password
B) To validate that a password meets the configured validators
C) To generate a new random password for a user
D) To encrypt a password before storing it in the database
E) To check if a password has been used before
144. In Django, which function is used to create a hashed password from a plain-text password?
A) check_password()
B) authenticate()
C) make_password()
D) hash_password()
E) encode_password()
145. What security risk arises from storing SECRET_KEY in a public version control repository?
A) The database connection string becomes visible to anyone
B) Attackers can forge session cookies, CSRF tokens, and signed data
C) The DEBUG setting is forced to True automatically
D) Middleware is bypassed on all incoming requests
E) The admin panel becomes inaccessible
146. Which approach is recommended for managing sensitive configuration values like SECRET_KEY and database passwords in Django?
A) Hard-coding them directly in settings.py
B) Storing them in environment variables or a secrets manager
C) Saving them in a comments section of urls.py
D) Encoding them in Base64 and placing them in views.py
E) Storing them in the database's configuration table
147. What is the purpose of a database backup in web application security?
A) To speed up database read operations
B) To allow recovery of data after a security incident or failure
C) To encrypt data at rest in the database
D) To synchronize data between two servers
E) To compress the database for faster network transfer
148. How often should Django security updates be applied in a production environment?
A) Only during major version upgrades
B) Once a year during scheduled maintenance
C) As soon as security patches are released
D) Only when a known exploit is actively used
E) After full regression testing that takes at least six months
149. What does 'defense in depth' mean in the context of web security?
A) Using a single very strong firewall at the network boundary
B) Applying multiple overlapping security controls at different layers
C) Encrypting all data both at rest and in transit
D) Restricting all user access by default
E) Performing security audits every six months
150. What is the principle of least privilege in user authorization?
A) Users must prove their identity with two factors
B) Users are granted only the minimum permissions needed for their role
C) All users share a single privileged account
D) Superusers must approve all data changes
E) New users receive all permissions and have them removed as needed
151. Which Django admin option allows restricting which model fields a staff user can see or edit?
A) list_display
B) readonly_fields and fields in ModelAdmin
C) search_fields
D) list_filter
E) ordering in ModelAdmin
152. What is the risk of leaving the Django admin interface accessible at the default /admin/ URL?
A) It disables CSRF protection on all admin forms
B) Attackers can easily find and target the admin login page
C) The admin panel requires DEBUG = True to function
D) Default URL bypasses SessionMiddleware automatically
E) It forces HTTP instead of HTTPS for admin requests
153. How can the Django admin URL be made harder to discover by attackers?
A) Disabling the admin panel entirely in all environments
B) Changing the admin URL to a custom, non-obvious path
C) Setting DEBUG = True only for the admin section
D) Removing all admin users from the database
E) Using only GET requests for all admin operations
154. What is a directory traversal attack?
A) Enumerating all users in the database via login error messages
B) Manipulating file path inputs to access files outside the intended directory
C) Injecting scripts into directory listing pages
D) Performing SQL queries on file system paths
E) Uploading malicious files that overwrite server configuration
155. Which Django setting lists the directories Django searches for static files and templates?
A) MEDIA_ROOT
B) STATICFILES_DIRS and TEMPLATES
C) BASE_DIR
D) FIXTURE_DIRS
E) INSTALLED_APPS
156. What does the MEDIA_URL and MEDIA_ROOT configuration control in Django?
A) The location and URL path for static CSS and JavaScript files
B) The storage location and URL path for user-uploaded files
C) The path to the Django admin media assets
D) The URL for serving error pages
E) The directory for compiled template caches
157. Why should file uploads be validated and restricted in a Django application?
A) To reduce the size of the database
B) To prevent uploading of malicious files that could be executed on the server
C) To enforce a consistent naming convention for files
D) To speed up the file serving process
E) To ensure all files are stored in a single directory
158. What is the purpose of setting FILE_UPLOAD_MAX_MEMORY_SIZE in Django?
A) To limit the size of the entire Django application
B) To restrict the maximum size of files held in memory during upload
C) To configure how many files a user can upload per session
D) To define the maximum size of static files
E) To set the database row size limit for file metadata
159. Which response class should be used in Django to serve a file securely without exposing its real filesystem path?
A) HttpResponse with Content-Type set to application/octet-stream
B) FileResponse with a file object
C) JsonResponse with base64-encoded file content
D) StreamingHttpResponse with plain text content
E) HttpResponseRedirect pointing to the file URL
160. What is insecure direct object reference (IDOR)?
A) Using weak hash algorithms to store object identifiers
B) Allowing users to access objects by manipulating identifiers without authorization checks
C) Storing object references in plaintext cookies
D) Exposing internal API endpoints via the admin panel
E) Using auto-incrementing IDs instead of UUIDs for primary keys
161. How does Django's get_object_or_404() function contribute to security?
A) It encrypts the retrieved object before returning it
B) It returns a 404 response instead of exposing server errors when an object is not found
C) It validates the object's permissions automatically
D) It sanitizes the object's fields before displaying them
E) It logs every object retrieval attempt to the security log
162. What is the purpose of Django's permission_required decorator?
A) To hash the request data before processing
B) To restrict view access to users who have a specific permission
C) To log all requests to a protected view
D) To apply CSRF validation to a specific view
E) To redirect all users to the login page
163. What Django feature allows object-level permissions beyond the default model-level permissions?
A) The built-in ContentType framework
B) Custom authentication backends implementing has_perm()
C) The django.contrib.admin.ModelAdmin class
D) The GROUP_PERMISSIONS setting
E) The AUTHENTICATION_BACKENDS list in settings.py
164. What is server-side request forgery (SSRF)?
A) Forging HTTP responses to mislead the client browser
B) Tricking the server into making requests to unintended internal or external resources
C) Injecting server-side scripts into user-uploaded files
D) Performing SQL queries through server-side cookies
E) Intercepting server responses using a proxy
165. What is the risk of running Django with DEBUG = True in production?
A) It disables the admin panel for all users
B) It exposes detailed error pages with source code, settings, and local variables
C) It forces all traffic to use HTTP instead of HTTPS
D) It disables CSRF protection globally
E) It logs all database queries to a public endpoint
166. What does the SECURE_BROWSER_XSS_FILTER setting do in older Django versions?
A) Enables Django's built-in XSS input scanner
B) Sends the X-XSS-Protection header to enable the browser's XSS filter
C) Strips all script tags from template output
D) Forces all cookies to be marked as Secure
E) Adds a Content-Security-Policy header
167. What is the role of the AuthenticationMiddleware in Django?
A) It hashes passwords on every request
B) It associates the current user object with each incoming request
C) It validates CSRF tokens on all POST requests
D) It enforces HTTPS on all incoming requests
E) It checks that the user's session has not expired
168. What does the SessionMiddleware do in Django?
A) It validates passwords on every request
B) It manages user session data by creating and reading session cookies
C) It enforces object-level permissions for all views
D) It encrypts all HTTP request bodies
E) It redirects unauthenticated users to the login page
169. What is credential stuffing?
A) Embedding credentials in source code accidentally
B) Using lists of stolen username-password pairs to attempt logins on other services
C) Storing credentials in plaintext in a configuration file
D) Generating weak passwords automatically for new accounts
E) Capturing credentials through a phishing page
170. Which Django setting controls the list of active middleware applied to each request?
A) INSTALLED_APPS
B) AUTHENTICATION_BACKENDS
C) MIDDLEWARE
D) SECURITY_PROCESSORS
E) WSGI_APPLICATION
171. What is the difference between authentication and authorization in a web application?
A) Authentication manages database connections; authorization manages HTTP methods
B) Authentication verifies who the user is; authorization determines what the user can do
C) Authentication encrypts data; authorization decrypts data
D) Authentication stores passwords; authorization stores permissions
E) Authentication applies to APIs; authorization applies to web pages only
172. In Django, what does the has_perm() method on a User object do?
A) Sets a new permission for the user
B) Checks whether the user has a specified permission
C) Lists all permissions assigned to the user
D) Removes a permission from the user
E) Grants a temporary permission for the current request
173. Which syntax is used in Django Template Language to output a variable named 'username'?
A) {{ username }}
B) {% username %}
C) <% username %>
D) \${username}
E) [[username]]
174. What is the correct Django template tag to check a condition?
A) {% if condition %}...{% endif %}
B) {{ if condition }}...{{ endif }}
C) <% if condition %>...<% end %>
D) {% check condition %}...{% endcheck %}
E) [% if condition %]...[% endif %]
175. Which Django template tag is used to loop over a list called 'items'?
A) {% for item in items %}...{% endfor %}
B) {{ for item in items }}...{{ endfor }}
C) {% loop item in items %}...{% endloop %}
D) <% for item in items %><% end %>
E) {% each item in items %}...{% endeach %}
176. What does the {% extends %} tag do in a Django template?
A) Declares that the current template inherits from a parent template
B) Includes another template inline at that position
C) Loads a set of custom template tags
D) Defines a reusable block in the current file
E) Imports a Python module into the template context
177. In Django template inheritance, which tag defines a replaceable section in the parent template?
A) {% block block_name %}...{% endblock %}
B) {% section block_name %}...{% endsection %}
C) {% slot block_name %}...{% endslot %}
D) {% region block_name %}...{% endregion %}
E) {% area block_name %}...{% endarea %}
178. Which tag is used to insert another template's content at a specific location in Django?
A) {% include 'template.html' %}
B) {% extend 'template.html' %}
C) {% import 'template.html' %}
D) {% embed 'template.html' %}
E) {% insert 'template.html' %}
179. How do you apply the 'upper' filter to a variable 'name' in Django templates?
A) {{ name|upper }}
B) {{ upper(name) }}
C) {% name|upper %}
D) {{ name.upper() }}
E) {{ name->upper }}
180. What is the purpose of the {% load %} tag in Django templates?
A) It loads a custom template tag library so its tags and filters become available
B) It loads a CSS file into the template
C) It reads data from a database model
D) It imports a Python function into the template context
E) It loads a JavaScript file into the page
181. Which Django template filter converts a string to all lowercase?
A) lower
B) downcase
C) small
D) tolower
E) shrink
182. What does the 'truncatechars:20' filter do in Django templates?
A) Truncates the string to at most 20 characters and appends ellipsis
B) Removes the first 20 characters from the string
C) Splits the string into chunks of 20 characters
D) Pads the string to exactly 20 characters
E) Counts the number of characters up to 20
183. Which filter would you use to display a number with thousands separators in Django templates?
A) intcomma
B) thousands
C) numberformat
D) addcommas
E) floatformat
184. How do you access a dictionary value for key 'city' in a Django template variable 'address'?
A) {{ address.city }}
B) {{ address['city'] }}
C) {{ address->city }}
D) {{ address|key:'city' }}
E) {{ address[city] }}
185. What does {{ value|default:'N/A' }} do when 'value' is an empty string?
A) Outputs 'N/A' because an empty string is falsy
B) Outputs the empty string since it technically exists
C) Raises a template error
D) Outputs the string 'value'
E) Outputs 'None'
186. Which tag would you use to get the current date and time in a Django template?
A) {% now 'Y-m-d H:i' %}
B) {{ datetime.now() }}
C) {% date 'now' %}
D) {{ current_time }}
E) {% time.now %}
187. What is the correct way to comment out a section in a Django template?
A) {# This is a comment #}
B) <!-- This is a comment -->
C) {% comment_out This is a comment %}
D) // This is a comment
E) /* This is a comment */
188. How do you use the multi-line comment tag in Django templates?
A) {% comment %}...{% endcomment %}
B) {# start #}...{# end #}
C) <!-- comment -->...<!-- endcomment -->
D) {% remark %}...{% endremark %}
E) {% note %}...{% endnote %}
189. Which Django template tag generates the URL for a named view called 'home'?
A) {% url 'home' %}
B) {{ url('home') }}
C) {% link 'home' %}
D) {% reverse 'home' %}
E) {{ reverse_url('home') }}
190. What does the {% csrf_token %} tag do in a Django template form?
A) Inserts a hidden input field with a security token to prevent cross-site request forgery
B) Encrypts the form data before submission
C) Validates the form fields on the client side
D) Generates a unique session identifier for the form
E) Creates a CAPTCHA challenge inside the form
191. In a Django template, what happens when you use {% for item in empty_list %}...{% empty %}...{% endfor %}?
A) The {% empty %} block renders if the list has no items
B) A TemplateSyntaxError is raised for an empty list
C) The loop silently skips and renders nothing
D) The template engine substitutes a default item
E) Django raises an ImproperlyConfigured exception
192. Which variable is available inside a {% for %} loop to indicate whether the current item is the last one?
A) forloop.last
B) loop.is_last
C) forloop.end
D) for.last_item
E) loop.final
193. What does forloop.counter provide inside a Django template loop?
A) The 1-based index of the current iteration
B) The 0-based index of the current iteration
C) The total number of items in the loop
D) Whether the loop is on an odd iteration
E) The remaining number of iterations
194. Which of the following is the correct way to load static files support in a Django template?
A) {% load static %}
B) {% import static %}
C) {% use static %}
D) {% include static %}
E) {% load staticfiles %}
195. After loading the static tag library, how do you reference a CSS file 'style.css' inside 'css/' in a Django template?
A) {% static 'css/style.css' %}
B) {{ STATIC_URL }}css/style.css
C) {% staticfile 'css/style.css' %}
D) {{ static('css/style.css') }}
E) {% load 'css/style.css' %}
196. Which Django setting must be configured to define the base URL for serving static files?
A) STATIC_URL
B) MEDIA_URL
C) STATICFILES_DIRS
D) STATIC_ROOT
E) ASSETS_URL
197. What is the purpose of STATICFILES_DIRS in a Django project?
A) It lists additional directories where Django will search for static files
B) It sets the URL prefix for static file access
C) It specifies the single folder where collectstatic puts files
D) It defines allowed MIME types for static assets
E) It sets per-app static file storage backends
198. When running collectstatic, where does Django place all gathered static files?
A) The directory defined by STATIC_ROOT
B) The directory defined by STATIC_URL
C) The STATICFILES_DIRS list
D) The project's root folder
E) The app's static/ subfolder
199. How do you pass data from a Django view to a template?
A) By providing a context dictionary to the render() function
B) By storing values in Django's session object
C) By adding variables directly to the template file
D) By using JavaScript localStorage in the browser
E) By including the data in the URL query string
200. What type of object is the context parameter passed to a Django template?
A) A dictionary mapping variable names to values
B) A list of tuples containing key-value pairs
C) A Django QuerySet object
D) A JSON string to be parsed in the template
E) A Python class instance with public attributes only
201. Which Django shortcut function renders a template with a given context and returns an HttpResponse?
A) render()
B) render_to_string()
C) get_template()
D) TemplateResponse()
E) direct_to_template()
202. What does render_to_string() return compared to render()?
A) A plain string of the rendered HTML, not an HttpResponse
B) An HttpResponse with the rendered template
C) A file object containing the rendered output
D) A bytes object of the compressed template
E) A generator yielding chunks of the rendered output
203. Which class-based view automatically selects a template based on the model name by convention?
A) ListView
B) TemplateView
C) DetailView
D) FormView
E) RedirectView
204. In a Django ListView for a model named Article, what is the default template name looked up?
A) app_label/article_list.html
B) app_label/article.html
C) templates/list.html
D) app_label/articles.html
E) app_label/article_detail.html
205. What is a Django reusable app?
A) A self-contained Django application that provides specific functionality and can be plugged into multiple projects
B) A single views.py file shared across multiple Django projects
C) A third-party Python package unrelated to Django's app structure
D) A static HTML file served by multiple Django sites
E) A Django project template for starting new websites
206. Which file must exist in a directory for Django to recognize it as an app?
A) apps.py or __init__.py (an app needs to be a Python package)
B) settings.py
C) models.py
D) urls.py
E) admin.py
207. How do you make Django aware of a new app called 'blog'?
A) Add 'blog' or 'blog.apps.BlogConfig' to INSTALLED_APPS in settings.py
B) Import the blog app in urls.py
C) Create a blog.py file in the project root
D) Add blog to the MIDDLEWARE list in settings.py
E) Register it in manage.py
208. Where should a Django app store its own templates when using per-app template directories?
A) Inside a 'templates/' subdirectory within the app folder
B) In the project-level templates/ folder only
C) In a static/ subfolder of the app
D) In a templatetags/ subfolder of the app
E) Directly in the app's root folder alongside views.py
209. What is the purpose of the templatetags/ directory inside a Django app?
A) It holds custom template tag and filter modules that can be loaded with {% load %}
B) It stores HTML template files for the app
C) It contains middleware classes for template processing
D) It holds serializers for template context data
E) It stores CSS and JS files used by the app's templates
210. What is required for a file inside templatetags/ to be recognised as a tag library?
A) The file must be a Python module (a .py file) inside a Python package (has __init__.py)
B) It must be named tags.py exactly
C) It must be listed in TEMPLATE_LIBRARIES in settings.py
D) It must import django.template.Library as 'register' at module level only if using Python 3
E) It needs to be compiled with manage.py collecttags
211. How do you register a custom simple template tag in Django?
A) Decorate a Python function with @register.simple_tag
B) Decorate a Python function with @register.filter
C) Subclass django.template.Node and call register.template()
D) Add the function name to TEMPLATE_TAGS in settings.py
E) Decorate a function with @tag in templatetags/
212. How do you register a custom template filter in Django?
A) Decorate a Python function with @register.filter
B) Decorate a function with @register.simple_tag
C) Subclass django.template.Library and add the function
D) List the filter in TEMPLATE_FILTERS inside settings.py
E) Use @register.inclusion_tag with a template path
213. What is an inclusion tag in Django's template system?
A) A tag that renders a specified sub-template with its own context and inserts the result
B) A tag used to include a static file path in the output
C) A tag that adds an HTML include directive to the page
D) A tag that imports a Python function and calls it during rendering
E) A tag that wraps content in a reusable HTML component without a sub-template
214. What must a custom template filter function return?
A) A string or a value safe to insert into the template output
B) A Django Response object
C) A QuerySet from the database
D) A dictionary that updates the template context
E) A boolean indicating filter success or failure
215. Which decorator marks a custom filter as safe so Django does not auto-escape its output?
A) @register.filter(is_safe=True)
B) @register.filter(escape=False)
C) @register.filter(safe=True)
D) @register.safe_filter
E) @mark_safe_filter
216. What does the mark_safe() function do in Django templates?
A) Marks a string as safe for HTML output, preventing auto-escaping
B) Sanitizes a string by removing all HTML tags
C) Escapes all special HTML characters in the string
D) Encrypts the string before inserting it into the template
E) Validates that the string contains no XSS vectors
217. What does Django's auto-escaping do to variable output by default?
A) Converts characters like <, >, &, ', " to their HTML entity equivalents
B) Strips all HTML tags from the variable value
C) Encodes the string as Base64 before rendering
D) Converts the variable to JSON format
E) URL-encodes the variable value
218. How do you disable auto-escaping for a block of content in a Django template?
A) {% autoescape off %}...{% endautoescape %}
B) {% noescape %}...{% endnoescape %}
C) {{ value|raw }}
D) {% escape off %}...{% endescape %}
E) {% safe %}...{% endsafe %}
219. Which template filter escapes HTML special characters explicitly?
A) escape
B) safe
C) mark_safe
D) htmlchars
E) sanitize
220. What does the 'safe' filter do in a Django template?
A) Marks a variable's value as safe, preventing auto-escaping
B) Removes dangerous HTML tags from the value
C) Validates the value against a security policy
D) Converts the value to a safe Base64 string
E) Applies CSRF protection to the rendered value
221. In Django template inheritance, which template must contain {% block %} tags?
A) The parent (base) template that child templates extend
B) The child template that uses {% extends %}
C) Both the parent and child templates equally
D) Only the lowest-level child in the hierarchy
E) Neither; blocks are optional in both templates
222. What does {{ block.super }} do inside a {% block %} tag in a child template?
A) Renders the parent template's content for that block in addition to the child's content
B) Calls the parent view's context processor
C) Imports the parent template's static files
D) Raises a TemplateSyntaxError if used in a base template
E) Replaces the block with an empty string from the parent
223. How many levels deep can Django template inheritance go?
A) There is no hard limit; inheritance can be nested multiple levels
B) Exactly one level (base → child only)
C) Up to three levels maximum
D) Up to five levels as set in TEMPLATES settings
E) Inheritance is limited to two levels in production
224. What is the effect of placing {% extends %} anywhere other than the first line of a template?
A) Django raises a TemplateSyntaxError because {% extends %} must be the first tag
B) The extends tag is silently ignored
C) Django merges blocks from both positions
D) The template renders the parent twice
E) Only the content before extends is shown
225. Which TEMPLATES backend setting enables template caching in Django?
A) Using 'django.template.loaders.cached.Loader' wrapping other loaders
B) Setting CACHE_TEMPLATES = True in settings.py
C) Adding 'cached' to the TEMPLATES OPTIONS list
D) Enabling TEMPLATE_CACHE in the DATABASES setting
E) Setting TEMPLATE_DEBUG = False automatically enables caching
226. What is the default template loader Django uses to find templates inside app subdirectories?
A) django.template.loaders.app_directories.Loader
B) django.template.loaders.filesystem.Loader
C) django.template.loaders.cached.Loader
D) django.template.loaders.eggs.Loader
E) django.template.loaders.module.Loader
227. Which loader searches for templates in directories listed in DIRS inside the TEMPLATES setting?
A) django.template.loaders.filesystem.Loader
B) django.template.loaders.app_directories.Loader
C) django.template.loaders.cached.Loader
D) django.template.loaders.network.Loader
E) django.template.loaders.database.Loader
228. What does setting APP_DIRS: True in the TEMPLATES configuration do?
A) Enables the app_directories loader so each installed app's templates/ folder is searched
B) Automatically discovers and registers all template tag libraries
C) Compiles all templates to bytecode when the server starts
D) Restricts template loading to app directories only, ignoring DIRS
E) Sets the template directory to the first installed app's folder
229. Which Django template filter formats a date object using a format string?
A) date
B) strftime
C) format_date
D) datetime
E) datefmt
230. What does the 'linebreaks' filter do in Django templates?
A) Converts plain text newlines into HTML <p> and <br> tags
B) Removes all line breaks from the text
C) Counts the number of line breaks in the text
D) Converts HTML <br> tags back into newlines
E) Adds a line break after every sentence
231. Which Django template filter joins a list into a single string with a separator?
A) join
B) concat
C) implode
D) merge
E) combine
232. How would you display the length of a list 'items' in a Django template?
A) {{ items|length }}
B) {{ items.count() }}
C) {% len(items) %}
D) {{ length(items) }}
E) {{ items|size }}
233. What does the 'add' filter do when applied to an integer in Django templates?
A) Adds the given value to the variable's numeric value
B) Appends the value as a string to the variable
C) Increments the variable by 1 regardless of the argument
D) Concatenates two lists together
E) Raises a TypeError if the variable is not a string
234. Which filter removes HTML tags from a string in Django templates?
A) striptags
B) removetags
C) htmlstrip
D) striphtml
E) cleanhtml
235. What does the 'slugify' filter do to a string in Django templates?
A) Converts the string to a URL-friendly slug (lowercase, hyphens, no special chars)
B) Converts the string to uppercase with underscores
C) Encodes the string as a URL query parameter
D) Wraps the string in URL-safe quotes
E) Splits the string into words and returns a list
236. Which Django template filter would you use to capitalize only the first letter of a string?
A) capfirst
B) capitalize
C) title
D) upper
E) initcap
237. What does the 'title' filter do in Django templates?
A) Converts the first letter of each word to uppercase
B) Converts the entire string to uppercase
C) Inserts the string as an HTML <title> element
D) Returns the model's verbose_name_plural value
E) Truncates the string to the page title length
238. How do you render a Django form field called 'form.username' as an HTML input in a template?
A) {{ form.username }}
B) {% render form.username %}
C) {% field form.username %}
D) {{ form.username.widget() }}
E) {% form_field 'username' %}
239. Which template tag renders all form errors for a specific field 'form.email'?
A) {{ form.email.errors }}
B) {% errors form.email %}
C) {{ form.errors.email }}
D) {% show_errors form.email %}
E) {{ form.email|errors }}
240. How do you render an entire Django form including all fields using template helpers?
A) {{ form.as_p }}
B) {% render_form form %}
C) {{ form.render() }}
D) {% form_display form %}
E) {{ form|as_html }}
241. What attribute of a Django form field gives the field's label text?
A) field.label
B) field.name
C) field.verbose_name
D) field.placeholder
E) field.title
242. Which attribute on a bound Django form field can be used to check if the field has validation errors?
A) field.errors
B) field.is_valid
C) field.invalid
D) field.error_list
E) field.messages
243. What does {{ form.as_table }} render in a Django template?
A) All form fields wrapped in <tr> and <td> HTML table tags
B) The form as an unordered list of fields
C) Each field wrapped in <p> tags
D) A single-row HTML table with column headers
E) An HTML <table> with the form's Meta class fields
244. In a Django template, which context variable contains request information when using RequestContext?
A) request
B) http_request
C) django_request
D) context.request
E) view_request
245. What is a context processor in Django?
A) A Python function that receives the request and returns a dictionary added to every template context
B) A class that compresses the context data before rendering
C) A middleware component that caches rendered templates
D) A template tag library for processing template context variables
E) A decorator applied to views to inject extra variables
246. Which built-in context processor adds the 'request' object to every template context?
A) django.template.context_processors.request
B) django.template.context_processors.auth
C) django.template.context_processors.csrf
D) django.contrib.messages.context_processors.messages
E) django.template.context_processors.debug
247. How do you add a custom context processor to a Django project?
A) Add the dotted path to the function in the context_processors list inside TEMPLATES OPTIONS
B) Decorate the function with @context_processor and place it in views.py
C) Register it in INSTALLED_APPS under context_processors key
D) Add it to MIDDLEWARE in settings.py
E) Import it in the app's apps.py ready() method
248. What does the 'with' template tag do in Django?
A) Creates a local variable alias within a block scope to avoid repeated lookups
B) Establishes a database transaction inside the template
C) Opens a file resource and exposes it as a template variable
D) Declares a new template context replacing the current one
E) Imports a template library under an alias name
249. Which tag is used to cycle through a list of values on each iteration in a Django template loop?
A) {% cycle 'odd' 'even' %}
B) {% alternate 'odd' 'even' %}
C) {% rotate 'odd' 'even' %}
D) {% switch 'odd' 'even' %}
E) {% toggle 'odd' 'even' %}
250. What does the {% spaceless %} tag do in a Django template?
A) Removes whitespace between HTML tags in the enclosed block
B) Adds a non-breaking space between words
C) Minifies all CSS inside the block
D) Strips all whitespace from text content inside the block
E) Converts multiple spaces to a single space in text nodes
251. What is the purpose of the {% verbatim %} tag in Django templates?
A) Prevents the template engine from interpreting any template syntax inside the block
B) Outputs a variable's raw Python repr() string
C) Disables HTML escaping for the enclosed content
D) Renders the block exactly once and caches the result
E) Converts template syntax characters to HTML entities
252. Which Django tag outputs the content of a variable without any escaping or processing?
A) {{ value|safe }}
B) {% raw value %}
C) {{ value|verbatim }}
D) {% output value %}
E) {{ value|nofilter }}
253. How do you pass an argument to a custom template tag that uses @register.simple_tag?
A) Include positional or keyword arguments in the template tag call: {% mytag arg1 arg2 %}
B) Pass arguments through the context dictionary only
C) Define arguments in TEMPLATE_TAG_ARGS in settings.py
D) Use a sub-template to pass variables to the tag
E) Custom simple_tags cannot accept arguments
254. What is an assignment tag (or simple_tag with takes_context=True) used for in Django?
A) It allows the tag to access the full template context within the Python function
B) It prevents the tag from returning any output to the template
C) It automatically assigns the result to a context variable
D) It replaces the current context with the tag's return value
E) It captures the tag's output into a template variable using 'as varname'
255. How would you store the result of a simple_tag into a template variable named 'result'?
A) {% mytag as result %}
B) {% mytag -> result %}
C) {% mytag => result %}
D) {% mytag | result %}
E) {% set result = mytag %}
256. What does a Django CMS plugin consist of at minimum?
A) A CMSPlugin model subclass and a corresponding plugin class that specifies the template
B) Only a template file and a URL pattern
C) A views.py file with plugin views and a models.py entry
D) A JavaScript file and a CSS file for the plugin's frontend
E) An admin class and a migration file only
257. In django CMS, which class must a plugin class inherit from to be registered as a CMS plugin?
A) CMSPluginBase
B) PluginBase
C) CMSPlugin
D) BasePlugin
E) CmsView
258. How do you register a plugin class with django CMS?
A) Call plugin_pool.register_plugin(PluginClass)
B) Add the plugin to INSTALLED_PLUGINS in settings.py
C) Decorate the plugin class with @cms_plugin
D) Import the plugin in cms_plugins.py under the app
E) Add the plugin to CMS_TEMPLATES in settings.py
259. Which file should contain plugin registrations in a django CMS app by convention?
A) cms_plugins.py
B) plugins.py
C) registry.py
D) cms_registry.py
E) init_plugins.py
260. What is the role of the 'model' attribute in a django CMS plugin class?
A) It links the plugin to its CMSPlugin model subclass that stores the plugin's data
B) It specifies the Django ORM model used for CRUD operations in the plugin view
C) It sets the database table name for the plugin's configuration
D) It defines the admin model class for managing plugin instances
E) It references the serializer used when exporting plugin data
261. What attribute in a django CMS plugin class specifies which HTML template to render?
A) render_template
B) template
C) plugin_template
D) html_file
E) template_name
262. What method in a CMSPluginBase subclass can be overridden to add extra variables to the plugin's context?
A) render()
B) get_context()
C) plugin_context()
D) context_data()
E) template_context()
263. What is the purpose of django-sekizai or similar tools in template development?
A) To manage blocks for injecting CSS and JavaScript into specific template regions from reusable components
B) To provide a WYSIWYG editor for editing template files in the browser
C) To compress and bundle static assets automatically
D) To generate template files from model definitions
E) To enforce consistent template syntax across the project
264. Which Django management command collects all static files into STATIC_ROOT?
A) python manage.py collectstatic
B) python manage.py gather_static
C) python manage.py build_static
D) python manage.py static_collect
E) python manage.py compress_static
265. What does the {% load humanize %} tag enable in a Django template?
A) It loads the humanize library providing filters like naturaltime, intcomma, and ordinal
B) It enables natural language processing inside templates
C) It loads user-facing error message filters
D) It imports human-readable date formatting from the OS locale
E) It activates accessibility-focused rendering mode
266. When building a reusable Django app, where should default templates be placed to follow best practices?
A) Inside templates/<app_label>/ within the app directory so they can be overridden per project
B) Directly in the project's root templates/ folder under the app name
C) In a templates.py file as Python string constants
D) Inside the app's static/ directory alongside CSS files
E) In a templates/ directory inside the project's settings module
`,
  answers: [
  "python3 -m venv myenv",
  "source myenv/bin/activate",
  "pip",
  "pip install django",
  "django-admin startproject mysite",
  "python manage.py startapp blog",
  "settings.py",
  "python manage.py runserver",
  "8000",
  "INSTALLED_APPS",
  "Database connection parameters for the project",
  "django.db.backends.sqlite3",
  "A command-line utility for interacting with the Django project",
  "def",
  "x = 10",
  "'Hello, World!'",
  "int",
  "bool",
  "<class 'float'>",
  "if",
  "else",
  "for",
  "break",
  "continue",
  "Integers from 0 to 4",
  "[1, 2, 3]",
  "list",
  "tuple",
  "set",
  "dict",
  "items[0]",
  "append()",
  "data['name']",
  "len()",
  "class Animal:",
  "__init__",
  "self",
  "Encapsulation",
  "Inheritance",
  "Polymorphism",
  "class Dog(Animal):",
  "Calls a method from the parent class",
  "Method overriding",
  "An object",
  "A variable defined directly inside the class body but outside methods",
  "requirements.txt",
  "pip freeze > requirements.txt",
  "import",
  "from os import path",
  "urls.py",
  "Provides an entry point for WSGI-compatible web servers",
  "ALLOWED_HOSTS",
  "['*'] or ['localhost', '127.0.0.1']",
  "python manage.py migrate",
  "python manage.py makemigrations",
  "Changes to the database schema over time",
  "django.contrib.admin",
  "A system for creating, managing, and publishing digital content without deep coding",
  "Wagtail",
  "To interact with the database using Python objects instead of raw SQL",
  "Triple quotes: '''text''' or \"\"\"text\"\"\"",
  "Outputs text to the standard output (console)",
  "int()",
  "3",
  "%",
  "Whether two variables reference the same object in memory",
  "lambda",
  "greet('Alice')",
  "def greet(name='World'):",
  "None",
  "if x > 10 and x < 20:",
  "Returns a human-readable string representation of the object",
  "Encapsulation",
  "Views",
  "Model-View-Template",
  "models.py",
  "HTML files that define how data is presented to the user",
  "python -m django --version",
  "dir()",
  "KeyError",
  "try...except",
  "TEMPLATES (specifically the DIRS key)",
  "STATICFILES_DIRS and STATIC_URL",
  "@classmethod with cls parameter",
  "@staticmethod",
  "python manage.py check",
  ".py",
  "[x**2 for x in range(1, 6)]",
  "Provides cryptographic signing for sessions, cookies, and tokens",
  "os",
  "Detailed error pages with tracebacks during development",
  "To prevent exposing sensitive error details and source code to users",
  "#",
  "Repeatedly executes a block of code as long as a condition remains True",
  "DEBUG",
  "To sign cookies, sessions, and CSRF tokens",
  "X-CSRFToken",
  "Apply the @csrf_exempt decorator",
  "Which domains/hostnames are permitted to serve the application",
  "CharField",
  "PBKDF2 with SHA-256",
  "To prevent rainbow table attacks by adding randomness",
  "django.contrib.auth.backends.ModelBackend",
  "Redirects unauthenticated users to the login page",
  "SECURE_SSL_REDIRECT",
  "An attack that tricks a user's browser into making unwanted requests",
  "An attack that injects client-side scripts into web pages viewed by others",
  "It automatically escapes HTML special characters in template variables",
  "{{ variable|safe }}",
  "Inserting malicious SQL code into input fields to manipulate database queries",
  "It uses parameterized queries that separate data from SQL code",
  "Pass values as a list of parameters to the params argument",
  "django.middleware.security.SecurityMiddleware",
  "Controls whether the page can be embedded in an iframe on another site",
  "Strict-Transport-Security",
  "To restrict which sources of content the browser is allowed to load",
  "SESSION_COOKIE_SECURE",
  "Prevents JavaScript from accessing the session cookie",
  "Create new instances of the model",
  "A superuser has all permissions without explicit assignment",
  "By creating a Group and assigning permissions to the Group",
  "UserPassesTestMixin",
  "Security Logging and Monitoring Failures",
  "Users being able to act outside their intended permissions",
  "Vulnerable and Outdated Components",
  "Regularly running pip list --outdated and updating packages",
  "To encrypt data transmitted between the client and the server",
  "An attack where a third party secretly intercepts communication between two parties",
  "It forces browsers to use HTTPS for all future requests to the domain",
  "SECURE_HSTS_SECONDS",
  "It stops the browser from guessing (sniffing) the MIME type of responses",
  "django.middleware.security.SecurityMiddleware",
  "Adds the X-Frame-Options header to responses to prevent clickjacking",
  "Tricking a user into clicking on something different from what they perceive",
  "SESSION_COOKIE_AGE",
  "Sessions are deleted when the user closes the browser",
  "MinimumLengthValidator",
  "Whether the password appears in a list of common passwords",
  "In the AUTH_PASSWORD_VALIDATORS setting in settings.py",
  "Limiting the number of login attempts to prevent systematic password guessing",
  "django-axes",
  "Requiring a second verification step in addition to the password",
  "To verify that a raw password matches a stored hashed password",
  "make_password()",
  "Attackers can forge session cookies, CSRF tokens, and signed data",
  "Storing them in environment variables or a secrets manager",
  "To allow recovery of data after a security incident or failure",
  "As soon as security patches are released",
  "Applying multiple overlapping security controls at different layers",
  "Users are granted only the minimum permissions needed for their role",
  "readonly_fields and fields in ModelAdmin",
  "Attackers can easily find and target the admin login page",
  "Changing the admin URL to a custom, non-obvious path",
  "Manipulating file path inputs to access files outside the intended directory",
  "STATICFILES_DIRS and TEMPLATES",
  "The storage location and URL path for user-uploaded files",
  "To prevent uploading of malicious files that could be executed on the server",
  "To restrict the maximum size of files held in memory during upload",
  "FileResponse with a file object",
  "Allowing users to access objects by manipulating identifiers without authorization checks",
  "It returns a 404 response instead of exposing server errors when an object is not found",
  "To restrict view access to users who have a specific permission",
  "Custom authentication backends implementing has_perm()",
  "Tricking the server into making requests to unintended internal or external resources",
  "It exposes detailed error pages with source code, settings, and local variables",
  "Sends the X-XSS-Protection header to enable the browser's XSS filter",
  "It associates the current user object with each incoming request",
  "It manages user session data by creating and reading session cookies",
  "Using lists of stolen username-password pairs to attempt logins on other services",
  "MIDDLEWARE",
  "Authentication verifies who the user is; authorization determines what the user can do",
  "Checks whether the user has a specified permission",
  "{{ username }}",
  "{% if condition %}...{% endif %}",
  "{% for item in items %}...{% endfor %}",
  "Declares that the current template inherits from a parent template",
  "{% block block_name %}...{% endblock %}",
  "{% include 'template.html' %}",
  "{{ name|upper }}",
  "It loads a custom template tag library so its tags and filters become available",
  "lower",
  "Truncates the string to at most 20 characters and appends ellipsis",
  "intcomma",
  "{{ address.city }}",
  "Outputs 'N/A' because an empty string is falsy",
  "{% now 'Y-m-d H:i' %}",
  "{# This is a comment #}",
  "{% comment %}...{% endcomment %}",
  "{% url 'home' %}",
  "Inserts a hidden input field with a security token to prevent cross-site request forgery",
  "The {% empty %} block renders if the list has no items",
  "forloop.last",
  "The 1-based index of the current iteration",
  "{% load static %}",
  "{% static 'css/style.css' %}",
  "STATIC_URL",
  "It lists additional directories where Django will search for static files",
  "The directory defined by STATIC_ROOT",
  "By providing a context dictionary to the render() function",
  "A dictionary mapping variable names to values",
  "render()",
  "A plain string of the rendered HTML, not an HttpResponse",
  "ListView",
  "app_label/article_list.html",
  "A self-contained Django application that provides specific functionality and can be plugged into multiple projects",
  "apps.py or __init__.py (an app needs to be a Python package)",
  "Add 'blog' or 'blog.apps.BlogConfig' to INSTALLED_APPS in settings.py",
  "Inside a 'templates/' subdirectory within the app folder",
  "It holds custom template tag and filter modules that can be loaded with {% load %}",
  "The file must be a Python module (a .py file) inside a Python package (has __init__.py)",
  "Decorate a Python function with @register.simple_tag",
  "Decorate a Python function with @register.filter",
  "A tag that renders a specified sub-template with its own context and inserts the result",
  "A string or a value safe to insert into the template output",
  "@register.filter(is_safe=True)",
  "Marks a string as safe for HTML output, preventing auto-escaping",
  "Converts characters like <, >, &, ', \" to their HTML entity equivalents",
  "{% autoescape off %}...{% endautoescape %}",
  "escape",
  "Marks a variable's value as safe, preventing auto-escaping",
  "The parent (base) template that child templates extend",
  "Renders the parent template's content for that block in addition to the child's content",
  "There is no hard limit; inheritance can be nested multiple levels",
  "Django raises a TemplateSyntaxError because {% extends %} must be the first tag",
  "Using 'django.template.loaders.cached.Loader' wrapping other loaders",
  "django.template.loaders.app_directories.Loader",
  "django.template.loaders.filesystem.Loader",
  "Enables the app_directories loader so each installed app's templates/ folder is searched",
  "date",
  "Converts plain text newlines into HTML <p> and <br> tags",
  "join",
  "{{ items|length }}",
  "Adds the given value to the variable's numeric value",
  "striptags",
  "Converts the string to a URL-friendly slug (lowercase, hyphens, no special chars)",
  "capfirst",
  "Converts the first letter of each word to uppercase",
  "{{ form.username }}",
  "{{ form.email.errors }}",
  "{{ form.as_p }}",
  "field.label",
  "field.errors",
  "All form fields wrapped in <tr> and <td> HTML table tags",
  "request",
  "A Python function that receives the request and returns a dictionary added to every template context",
  "django.template.context_processors.request",
  "Add the dotted path to the function in the context_processors list inside TEMPLATES OPTIONS",
  "Creates a local variable alias within a block scope to avoid repeated lookups",
  "{% cycle 'odd' 'even' %}",
  "Removes whitespace between HTML tags in the enclosed block",
  "Prevents the template engine from interpreting any template syntax inside the block",
  "{{ value|safe }}",
  "Include positional or keyword arguments in the template tag call: {% mytag arg1 arg2 %}",
  "It allows the tag to access the full template context within the Python function",
  "{% mytag as result %}",
  "A CMSPlugin model subclass and a corresponding plugin class that specifies the template",
  "CMSPluginBase",
  "Call plugin_pool.register_plugin(PluginClass)",
  "cms_plugins.py",
  "It links the plugin to its CMSPlugin model subclass that stores the plugin's data",
  "render_template",
  "render()",
  "To manage blocks for injecting CSS and JavaScript into specific template regions from reusable components",
  "python manage.py collectstatic",
  "It loads the humanize library providing filters like naturaltime, intcomma, and ordinal",
  "Inside templates/<app_label>/ within the app directory so they can be overridden per project"
]
};
