window.QUIZ_BANKS = window.QUIZ_BANKS || {};

window.QUIZ_BANKS.gaziz = {
  raw: `

1. What is Django? 
A) Python web framework 
B) Python library 
C) HTML library 
D) CSS framework 
E) CSS library 
2. Django is written in which language? 
A) Java 
B) C++ 
C) JavaScript 
D) Python 
E) PHP 
3. Which architecture does Django follow? 
A) MVC 
B) MVP 
C) MVVM 
D) MVT 
E) MVU 
4. Which file contains Django project settings? 
A) urls.py 
B) views.py 
C) models.py 
D) manage.py 
E) settings.py 
5. Which command creates a new Django project? 
A) django start 
B) django new 
C) startproject 
D) django-admin startproject 
E) django create 
6. Which command creates a new Django app? 
A) django newapp 
B) django startapp 
C) python manage.py startapp 
D) python django app 
E) manage.py new 
7. Which file defines URL routes? 
A) views.py 
B) models.py 
C) admin.py 
D) urls.py 
E) settings.py 
8. Which file contains database models? 
A) views.py 
B) models.py 
C) urls.py 
D) admin.py 
E) forms.py 
9. Which database is used by default in Django? 
A) MySQL 
B) PostgreSQL 
C) Oracle 
D) MongoDB 
E) SQLite 
10. Which command runs the Django development server? 
A) django run 
B) start server 
C) django server 
D) python manage.py runserver 
E) python django start 
11. Which file handles HTTP requests? 
A) models.py 
B) views.py 
C) admin.py 
D) settings.py 
E) urls.py 
12. What is a Django app? 
A) A database 
B) A server 
C) A reusable module 
D) A frontend framework 
E) A CSS file 
13. Which Django feature handles user authentication? 
A) django.forms 
B) django.urls 
C) django.contrib.auth 
D) django.db 
E) django.http 
14. What does ORM stand for? 
A) Object Request Model 
B) Online Resource Manager 
C) Object Relational Mapping 
D) Open Relation Model 
E) Object Runtime Module 
15. Django ORM is used to work with: 
A) HTML 
B) CSS 
C) JavaScript 
D) APIs 
E) Databases 
16. Which command creates database tables? 
A) migrate db 
B) create db 
C) makedb 
D) python manage.py migrate 
E) python db create 
17. Which command prepares migrations? 
A) migrate 
B) makemigrations 
C) startmigrate 
D) createmigrate 
E) dbmigrate 
18. Which file registers models in admin panel? 
A) views.py 
B) models.py 
C) admin.py 
D) urls.py 
E) settings.py 
19. Django admin panel is available by default at: 
A) /login 
B) /panel 
C) /dashboard 
D) /control 
E) /admin 
20. Which command creates a superuser? 
A) createsuper 
B) adminuser 
C) python manage.py createsuperuser 
D) makeadmin 
E) superuser create 
21. Which template engine is used by Django by default? 
A) Jinja2 
B) Blade 
C) Twig 
D) Smarty 
E) Django Template Language 
22. Templates in Django are used for: 
A) Database 
B) Backend logic 
C) API calls 
D) HTML rendering 
E) CSS styling 
23. Which file defines installed apps? 
A) urls.py 
B) admin.py 
C) models.py 
D) manage.py 
E) settings.py 
24. What does manage.py do? 
A) Starts database 
B) Runs frontend 
C) Manages Django commands 
D) Handles CSS 
E) Creates HTML 
25. Django is mainly used for: 
A) Mobile apps 
B) Game development 
C) Desktop apps 
D) Web development 
E) OS development 
26. Which HTTP method is used to get data? 
A) PUSH 
B) DELETE 
C) UPDATE 
D) GET 
E) PATCH 
27. Which HTTP method sends data to server? 
A) READ 
B) POST 
C) FETCH 
D) GET 
E) SEND 
28. Which Django object represents a request? 
A) Response 
B) Server 
C) Browser 
D) HttpRequest 
E) HttpServer 
29. Which Django object sends data back to user? 
A) HttpRequest 
B) Server 
C) HttpResponse 
D) Template 
E) Model 
30. Which command collects static files? 
A) collect 
B) staticfiles 
C) static collect 
D) python manage.py collectstatic 
E) make static 
31. Static files include: 
A) Python code 
B) Database 
C) CSS and JS files 
D) Models 
E) Views 
32. Django middleware is used for: 
A) Styling 
B) Database creation 
C) Template design 
D) Request and response processing 
E) Writing HTML 
33. Which file lists middleware? 
A) urls.py 
B) models.py 
C) admin.py 
D) settings.py 
E) views.py 
34. Django supports REST APIs using: 
A) Django Forms 
B) Django ORM 
C) Django REST Framework 
D) Django Admin 
E) Django Templates 
35. Serializer in DRF is used for: 
A) Styling pages 
B) Database connection 
C) Converting data to JSON 
D) Writing SQL 
E) Handling URLs 
36. Which file defines app configuration? 
A) views.py 
B) models.py 
C) urls.py 
D) apps.py 
E) admin.py 
37. Django model field for text data: 
A) IntegerField 
B) BooleanField 
C) DateField 
D) FloatField 
E) CharField 
38. Which field is used for large text? 
A) CharField 
B) IntegerField 
C) BooleanField 
D) TextField 
E) DateField 
39. Which Django command checks for errors? 
A) test 
B) debug 
C) runserver 
D) migrate 
E) check 
40. Django settings.py stores: 
A) HTML code 
B) CSS files 
C) Project configuration 
D) Database data 
E) User data 
41. Which database is recommended for production? 
A) SQLite 
B) CSV 
C) XML 
D) PostgreSQL 
E) TXT 
42. Django supports which OS? 
A) Only Windows 
B) Only Linux 
C) Only macOS 
D) All operating systems 
E) Android only 
43. Which Django feature improves security? 
A) ORM only 
B) Templates 
C) Built-in protection against attacks 
D) Static files 
E) Admin panel 
44. Which attack Django protects against by default? 
A) DDoS 
B) Virus 
C) SQL Injection 
D) Hardware failure 
E) Power loss 
45. Django uses which language for templates? 
A) Java 
B) C++ 
C) PHP 
D) HTML only 
E) Django Template Language 
46. Which command runs tests? 
A) runserver 
B) migrate 
C) makemigrations 
D) python manage.py test 
E) check 
47. Django views can be: 
A) Only classes 
B) Only functions 
C) Functions or classes 
D) Only templates 
E) Only models 
48. Which Django feature handles forms? 
A) django.db 
B) django.urls 
C) django.views 
D) django.forms 
E) django.admin 
49. Which file defines URL for an app? 
A) settings.py 
B) models.py 
C) views.py 
D) admin.py 
E) urls.py 
50. Django is: 
A) Frontend framework 
B) Database system 
C) Operating system 
D) Programming language 
E) Backend web framework 
51. What is pip used for in Django projects? 
A) Running server 
B) Creating databases 
C) Writing HTML 
D) Installing Python packages 
E) Creating users 
52. Which file is executed to manage a Django project? 
A) settings.py 
B) urls.py 
C) views.py 
D) admin.py 
E) manage.py 
53. What does DEBUG = True mean? 
A) Production mode 
B) Database is off 
C) Server is stopped 
D) Development mode is enabled 
E) Security is disabled 
54. Which Django command stops the server? 
A) stopserver 
B) exitserver 
C) Ctrl + C 
D) django stop 
E) python stop 
55. Which Django setting defines allowed domains? 
A) DEBUG 
B) DATABASES 
C) INSTALLED_APPS 
D) ALLOWED_HOSTS 
E) MIDDLEWARE 
56. Which Django module handles URLs? 
A) django.db 
B) django.forms 
C) django.http 
D) django.urls 
E) django.auth 
57. What is a Django model? 
A) HTML page 
B) CSS file 
C) Database table representation 
D) URL handler 
E) Template file 
58. Which command shows all available Django commands? 
A) showcommands 
B) list 
C) python manage.py help 
D) django help 
E) python django 
59. Which Django command creates test database? 
A) migrate 
B) makemigrations 
C) runserver 
D) python manage.py test 
E) createsuperuser 
60. What does INSTALLED_APPS contain? 
A) HTML pages 
B) Middleware 
C) Database tables 
D) Users 
E) List of enabled apps 
61. Which Django feature prevents CSRF attacks? 
A) ORM 
B) Templates 
C) Middleware 
D) CSRF token 
E) Admin panel 
62. What is urls.py used for? 
A) Database settings 
B) HTML rendering 
C) Mapping URLs to views 
D) Creating users 
E) Styling pages 
63. Which Django class is used for class-based views? 
A) HttpRequest 
B) HttpResponse 
C) View 
D) Model 
E) Form 
64. Which command opens Django shell? 
A) openshell 
B) pythonshell 
C) shell open 
D) python manage.py shell 
E) django shell 
65. What is Django shell used for? 
A) Writing HTML 
B) Running server 
C) Testing code interactively 
D) Creating CSS 
E) Running browser 
66. Which Django field stores True/False? 
A) CharField 
B) IntegerField 
C) TextField 
D) BooleanField 
E) DateField 
67. Which Django field stores dates? 
A) CharField 
B) IntegerField 
C) DateField 
D) BooleanField 
E) FloatField 
68. Which Django template tag is used for inheritance? 
A) include 
B) for 
C) if 
D) extends 
E) block 
69. Which tag defines a block in templates? 
A) if 
B) for 
C) extends 
D) block 
E) load 
70. Which Django command removes migrations? 
A) clear 
B) reset 
C) delete 
D) No direct command 
E) remove 
71. What does ForeignKey represent? 
A) Primary key 
B) Relation between tables 
C) Text field 
D) Boolean value 
E) Date field 
72. Which relationship allows many objects? 
A) OneToOne 
B) ManyToMany 
C) ForeignKey only 
D) SingleField 
E) TextRelation 
73. Which Django command applies migrations? 
A) makemigrations 
B) startapp 
C) runserver 
D) migrate 
E) test 
74. Which Django setting defines database config? 
A) TEMPLATES 
B) STATICFILES 
C) MIDDLEWARE 
D) DATABASES 
E) AUTH_USER 
75. Which Django file handles forms validation? 
A) models.py 
B) views.py 
C) urls.py 
D) forms.py 
E) admin.py 
76. Which Django decorator restricts access? 
A) csrf_token 
B) require_GET 
C) login_required 
D) render 
E) redirect 
77. What is render() used for? 
A) Saving data 
B) Redirecting user 
C) Returning HTML response 
D) Creating model 
E) Handling URLs 
78. Which Django shortcut redirects user? 
A) render 
B) response 
C) redirect 
D) view 
E) send 
79. Which HTTP status code means OK? 
A) 404 
B) 500 
C) 301 
D) 403 
E) 200 
80. Which Django model field auto-increments ID? 
A) CharField 
B) TextField 
C) BooleanField 
D) AutoField 
E) DateField 
81. Which Django feature handles sessions? 
A) ORM 
B) Templates 
C) Session framework 
D) Static files 
E) Signals 
82. Which Django setting defines static files path? 
A) MEDIA_ROOT 
B) DATABASES 
C) STATIC_URL 
D) SECRET_KEY 
E) TEMPLATES 
83. What is SECRET_KEY used for? 
A) Database password 
B) User login 
C) Security and cryptography 
D) HTML encryption 
E) CSS protection 
84. Which Django command creates a new app folder? 
A) startproject 
B) startapp 
C) newapp 
D) createapp 
E) addapp 
85. Which Django feature sends signals? 
A) Middleware 
B) Templates 
C) ORM 
D) Signals 
E) Admin 
86. Which file defines custom user model? 
A) admin.py 
B) views.py 
C) models.py 
D) urls.py 
E) forms.py 
87. Django supports which type of views? 
A) Function only 
B) Class only 
C) Template only 
D) API only 
E) Function and class-based 
88. Which Django command checks project issues? 
A) test 
B) migrate 
C) check 
D) runserver 
E) shell 
89. Which Django feature helps reuse templates? 
A) Models 
B) ORM 
C) Template inheritance 
D) Admin panel 
E) Forms 
90. Which Django admin action edits data? 
A) Read only 
B) View only 
C) Create, update, delete 
D) Export only 
E) Login only 
91. Which Django model field stores numbers? 
A) CharField 
B) TextField 
C) IntegerField 
D) BooleanField 
E) DateField 
92. Which Django setting enables templates? 
A) DATABASES 
B) STATIC_URL 
C) TEMPLATES 
D) MIDDLEWARE 
E) AUTH 
93. Which Django feature improves performance? 
A) Templates 
B) Forms 
C) Caching 
D) Admin 
E) Signals 
94. Which Django command loads fixtures? 
A) dumpdata 
B) migrate 
C) loaddata 
D) test 
E) collectstatic 
95. Which Django command exports data? 
A) loaddata 
B) test 
C) migrate 
D) dumpdata 
E) shell 
96. Which Django model field stores email? 
A) CharField 
B) TextField 
C) IntegerField 
D) EmailField 
E) URLField 
97. Which Django model field stores URLs? 
A) TextField 
B) CharField 
C) URLField 
D) IntegerField 
E) BooleanField 
98. Which Django feature handles file uploads? 
A) ORM 
B) Templates 
C) Middleware 
D) FileField 
E) Signals 
99. Which Django setting defines media files path? 
A) STATIC_URL 
B) STATIC_ROOT 
C) MEDIA_ROOT 
D) DATABASES 
E) TEMPLATES 
100. Django is best described as: 
A) Database 
B) Frontend library 
C) API only tool 
D) CMS 
E) High-level Python web framework 
101. What is a Django view? 
A) Database table 
B) HTML file 
C) CSS file 
D) Function or class that handles requests 
E) URL pattern 
102. Which Django function loads templates? 
A) load() 
B) template() 
C) render() 
D) show() 
E) display() 
103. Which Django file connects views and URLs? 
A) models.py 
B) admin.py 
C) settings.py 
D) urls.py 
E) forms.py 
104. What does python manage.py runserver do? 
A) Creates database 
B) Runs tests 
C) Stops server 
D) Starts development server 
E) Creates app 
105. Which Django setting turns off debug info? 
A) DEBUG = ON 
B) DEBUG = False 
C) DEBUG = 1 
D) DEBUG = None 
E) DEBUG = Stop 
106. Which Django component handles database queries? 
A) Templates 
B) Views 
C) ORM 
D) URLs 
E) Forms 
107. Which Django model field is required by default? 
A) CharField 
B) TextField 
C) IntegerField 
D) BooleanField 
E) id field 
108. Which Django admin feature allows data editing? 
A) Read mode 
B) View mode 
C) CRUD interface 
D) Export tool 
E) Debug panel 
109. Which Django module handles HTTP responses? 
A) django.db 
B) django.forms 
C) django.http 
D) django.urls 
E) django.views 
110. 
Which Django object represents a user? 
A) Request 
B) Response 
C) Session 
D) User model 
E) Template 
111. 
Which Django feature manages users and permissions? 
A) ORM 
B) Templates 
C) Authentication system 
D) Static files 
E) Signals 
112. 
Which Django setting stores secret value? 
A) DATABASES 
B) DEBUG 
C) STATIC_URL 
D) SECRET_KEY 
E) MIDDLEWARE 
113. 
Which Django command creates database schema? 
A) makedb 
B) migrate 
C) startapp 
D) runserver 
E) shell 
114. 
Which Django template tag is used for loops? 
A) if 
B) block 
C) extends 
D) for 
E) include 
115. 
Which Django template tag loads static files? 
A) import 
B) css 
C) load static 
D) staticfile 
E) include static 
116. 
Which Django setting defines language? 
A) TIME_ZONE 
B) DATABASES 
C) STATIC_URL 
D) LANGUAGE_CODE 
E) USE_TZ 
117. 
Which Django setting defines time zone? 
A) LANGUAGE_CODE 
B) STATIC_ROOT 
C) TIME_ZONE 
D) MEDIA_ROOT 
E) DATABASES 
118. 
Which Django feature supports internationalization? 
A) ORM 
B) Admin 
C) i18n 
D) Sessions 
E) Signals 
119. 
Which Django command creates migrations files? 
A) migrate 
B) makemigrations 
C) startproject 
D) test 
E) runserver 
120. Which Django model field stores decimal numbers? 
A) IntegerField 
B) FloatField 
C) DecimalField 
D) BooleanField 
E) CharField 
121. Which Django feature helps speed up responses? 
A) Forms 
B) Signals 
C) Caching 
D) Templates 
E) Admin 
122. Which Django middleware handles security? 
A) ORM 
B) Templates 
C) Views 
D) SecurityMiddleware 
E) Forms 
123. Which Django command removes database tables? 
A) dropdb 
B) reset 
C) delete 
D) No direct command 
E) cleardb 
124. Which Django model field stores time? 
A) DateField 
B) TimeField 
C) CharField 
D) IntegerField 
E) BooleanField 
125. Which Django feature logs users in? 
A) Sessions 
B) Middleware 
C) Authentication 
D) ORM 
E) Signals 
126. Which Django function returns JSON response? 
A) render 
B) redirect 
C) JsonResponse 
D) HttpRequest 
E) HttpServer 
127. Which Django app handles static files? 
A) django.db 
B) django.http 
C) django.contrib.staticfiles 
D) django.auth 
E) django.forms 
128. Which Django setting lists middleware classes? 
A) INSTALLED_APPS 
B) DATABASES 
C) TEMPLATES 
D) MIDDLEWARE 
E) AUTH 
129. Which Django feature protects passwords? 
A) ORM 
B) Templates 
C) Password hashing 
D) Sessions 
E) URLs 
130. Which Django command checks configuration errors? 
A) test 
B) migrate 
C) check 
D) shell 
E) runserver 
131. Which Django model field stores images? 
A) FileField 
B) CharField 
C) ImageField 
D) TextField 
E) URLField 
132. Which Django package is needed for ImageField? 
A) NumPy 
B) Requests 
C) Pillow 
D) Flask 
E) Pandas 
133. Which Django feature allows API creation? 
A) Templates 
B) Admin 
C) Django REST Framework 
D) ORM 
E) Signals 
134. Which Django decorator requires POST method? 
A) login_required 
B) csrf_token 
C) require_POST 
D) require_GET 
E) staff_required 
135. Which Django setting defines allowed static dirs? 
A) STATIC_URL 
B) STATIC_ROOT 
C) STATICFILES_DIRS 
D) MEDIA_ROOT 
E) DATABASES 
136. Which Django template filter makes text uppercase? 
A) lower 
B) title 
C) capitalize 
D) upper 
E) big 
137. Which Django feature connects signals? 
A) ORM 
B) Admin 
C) Signals framework 
D) Templates 
E) URLs 
138. Which Django command shows SQL queries? 
A) test 
B) shell 
C) dbshell 
D) migrate 
E) check 
139. Which Django file usually contains business logic? 
A) models.py 
B) urls.py 
C) views.py 
D) settings.py 
E) admin.py 
140. Which Django admin feature allows customization? 
A) Themes 
B) CSS editor 
C) ModelAdmin 
D) ORM 
E) Middleware 
141. Which Django feature stores user data between requests? 
A) Cookies only 
B) Cache 
C) Sessions 
D) ORM 
E) Signals 
142. Which Django setting enables CSRF protection? 
A) DEBUG 
B) DATABASES 
C) MIDDLEWARE 
D) STATIC_URL 
E) TEMPLATES 
143. Which Django object handles form validation? 
A) Model 
B) View 
C) Form 
D) Template 
E) URL 
144. Which Django field is optional by default? 
A) id 
B) CharField 
C) IntegerField 
D) Field with blank=True 
E) DateField 
145. Which Django template tag includes another template? 
A) extends 
B) load 
C) block 
D) include 
E) static 
146. Which Django command resets app migrations? 
A) reset 
B) clear 
C) delete 
D) Manual delete required 
E) migrate 
147. Which Django setting controls logging? 
A) DEBUG 
B) DATABASES 
C) LOGGING 
D) TEMPLATES 
E) STATIC_URL 
148. Which Django feature supports pagination? 
A) ORM 
B) Templates 
C) Paginator 
D) Signals 
E) Middleware 
149. Which Django object handles database records? 
A) View 
B) Template 
C) Model 
D) URL 
E) Form 
150. Django is commonly used with which frontend? 
A) Django only 
B) Any frontend (React, HTML, etc.) 
C) React only 
D) Angular only 
E) Vue only 

`,
  answers: [
  "Python web framework",
  "Python",
  "MVT",
  "settings.py",
  "django-admin startproject",
  "python manage.py startapp",
  "urls.py",
  "models.py",
  "SQLite",
  "python manage.py runserver",
  "views.py",
  "A reusable module",
  "django.contrib.auth",
  "Object Relational Mapping",
  "Databases",
  "python manage.py migrate",
  "makemigrations",
  "admin.py",
  "/admin",
  "python manage.py createsuperuser",
  "Django Template Language",
  "HTML rendering",
  "settings.py",
  "Manages Django commands",
  "Web development",
  "GET",
  "POST",
  "HttpRequest",
  "HttpResponse",
  "python manage.py collectstatic",
  "CSS and JS files",
  "Request and response processing",
  "settings.py",
  "Django REST Framework",
  "Converting data to JSON",
  "apps.py",
  "CharField",
  "TextField",
  "check",
  "Project configuration",
  "PostgreSQL",
  "All operating systems",
  "Built-in protection against attacks",
  "SQL Injection",
  "Django Template Language",
  "python manage.py test",
  "Functions or classes",
  "django.forms",
  "urls.py",
  "Backend web framework",
  "Installing Python packages",
  "manage.py",
  "Development mode is enabled",
  "Ctrl + C",
  "ALLOWED_HOSTS",
  "django.urls",
  "Database table representation",
  "python manage.py help",
  "python manage.py test",
  "List of enabled apps",
  "CSRF token",
  "Mapping URLs to views",
  "View",
  "python manage.py shell",
  "Testing code interactively",
  "BooleanField",
  "DateField",
  "extends",
  "block",
  "No direct command",
  "Relation between tables",
  "ManyToMany",
  "migrate",
  "DATABASES",
  "forms.py",
  "login_required",
  "Returning HTML response",
  "redirect",
  "200",
  "AutoField",
  "Session framework",
  "STATIC_URL",
  "Security and cryptography",
  "startapp",
  "Signals",
  "models.py",
  "Function and class-based",
  "check",
  "Template inheritance",
  "Create, update, delete",
  "IntegerField",
  "TEMPLATES",
  "Caching",
  "loaddata",
  "dumpdata",
  "EmailField",
  "URLField",
  "FileField",
  "MEDIA_ROOT",
  "High-level Python web framework",
  "Function or class that handles requests",
  "render()",
  "urls.py",
  "Starts development server",
  "DEBUG = False",
  "ORM",
  "id field",
  "CRUD interface",
  "django.http",
  "User model",
  "Authentication system",
  "SECRET_KEY",
  "migrate",
  "for",
  "load static",
  "LANGUAGE_CODE",
  "TIME_ZONE",
  "i18n",
  "makemigrations",
  "DecimalField",
  "Caching",
  "SecurityMiddleware",
  "No direct command",
  "TimeField",
  "Authentication",
  "JsonResponse",
  "django.contrib.staticfiles",
  "MIDDLEWARE",
  "Password hashing",
  "check",
  "ImageField",
  "Pillow",
  "Django REST Framework",
  "require_POST",
  "STATICFILES_DIRS",
  "upper",
  "Signals framework",
  "dbshell",
  "views.py",
  "ModelAdmin",
  "Sessions",
  "MIDDLEWARE",
  "Form",
  "Field with blank=True",
  "include",
  "Manual delete required",
  "LOGGING",
  "Paginator",
  "Model",
  "Any frontend (React, HTML, etc.)"
  ]
};

