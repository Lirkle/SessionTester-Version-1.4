window.QUIZ_BANKS = window.QUIZ_BANKS || {};

window.QUIZ_BANKS.moo_web_technologies_ws = {
  raw: `
1. Which of the following is a valid variable name in Python?
A) 2name
B) my-var
C) _count
D) class
E) for
2. What data type does the expression type(3.14) return?
A) int
B) str
C) float
D) complex
E) bool
3. What is the result of the expression 10 // 3 in Python?
A) 3.33
B) 3
C) 4
D) 1
E) 0
4. Which operator is used for exponentiation in Python?
A) %
B) ^
C) **
D) //
E) *
5. What value does bool('') evaluate to in Python?
A) True
B) None
C) 0
D) False
E) Error
6. What keyword is used to define a function in Python?
A) function
B) define
C) func
D) def
E) lambda
7. Which of the following correctly creates an empty list in Python?
A) {}
B) ()
C) []
D) <>
E) list{}
8. What does the len() function return when called on the string 'hello'?
A) 4
B) 6
C) 5
D) 7
E) 0
9. What is the index of the first element in a Python list?
A) 1
B) -1
C) 0
D) None
E) start
10. Which control flow statement is used to exit a loop immediately in Python?
A) exit
B) return
C) stop
D) break
E) continue
11. What will the following code print: print(type([1,2,3]))?
A) <class 'tuple'>
B) <class 'set'>
C) <class 'dict'>
D) <class 'list'>
E) <class 'array'>
12. Which of the following is an immutable data type in Python?
A) list
B) dict
C) set
D) tuple
E) bytearray
13. What does the range(5) function produce?
A) [1, 2, 3, 4, 5]
B) [0, 1, 2, 3, 4, 5]
C) [0, 1, 2, 3, 4]
D) [1, 2, 3, 4]
E) [0, 1, 2, 3]
14. Which keyword is used to handle exceptions in Python?
A) catch
B) handle
C) rescue
D) except
E) error
15. What does the pass statement do in Python?
A) Terminates the program
B) Skips the current iteration
C) Returns None from a function
D) Does nothing and acts as a placeholder
E) Raises an exception
16. How do you import only the sqrt function from the math module?
A) import math.sqrt
B) from math import sqrt
C) include math.sqrt
D) using math import sqrt
E) get math.sqrt
17. What is the output of print(2 ** 3)?
A) 5
B) 6
C) 8
D) 9
E) 23
18. Which method adds an element to the end of a list?
A) add()
B) insert()
C) extend()
D) append()
E) push()
19. What will len({'a': 1, 'b': 2, 'c': 3}) return?
A) 6
B) 2
C) 4
D) 3
E) 1
20. How is a tuple different from a list in Python?
A) Tuples can only hold strings
B) Tuples are ordered but unindexed
C) Tuples are mutable while lists are immutable
D) Tuples are immutable while lists are mutable
E) Tuples use curly braces
21. What is the correct syntax for a list comprehension that creates squares of numbers 0 through 4?
A) [x^2 for x in range(5)]
B) [x**2 in range(5)]
C) [x**2 for x in range(5)]
D) {x**2 for x in range(5)}
E) (x**2 for x in range(5))
22. What does the keyword self refer to in a Python class method?
A) The parent class
B) The class itself as a static reference
C) The module the class belongs to
D) The instance of the class
E) The return value of the method
23. Which method is automatically called when a new object is created from a class?
A) __new__
B) __create__
C) __start__
D) __init__
E) __call__
24. What is encapsulation in object-oriented programming?
A) Calling parent class methods from a child class
B) Creating multiple classes with the same name
C) Bundling data and methods that operate on that data within one unit
D) Using the same method name for different behaviors
E) Hiding the implementation of a method in a module
25. Which of the following demonstrates inheritance in Python?
A) class Dog: pass
B) class Dog(Animal): pass
C) class Dog = Animal: pass
D) class Dog inherits Animal: pass
E) class Dog -> Animal: pass
26. What does polymorphism allow in OOP?
A) A class to have multiple constructors
B) A method to be defined in only one class
C) Objects of different classes to be used through the same interface
D) A variable to hold only one type of data
E) A function to return multiple values
27. What will be printed: x = 5; def f(): x = 10; f(); print(x)?
A) 10
B) None
C) 15
D) 5
E) Error
28. How do you define a global variable inside a function in Python?
A) static x = 10
B) extern x
C) public x = 10
D) global x
E) shared x
29. What is the correct way to catch any exception regardless of type?
A) except TypeError:
B) except *:
C) except all:
D) except Exception:
E) except Error:
30. Which dictionary method returns all keys of a dictionary?
A) dictionary.values()
B) dictionary.items()
C) dictionary.all()
D) dictionary.keys()
E) dictionary.index()
31. What is the output of 'Python'[1:4]?
A) Pyt
B) ytho
C) yth
D) Pyth
E) tho
32. Which of the following creates a set in Python?
A) [1, 2, 3]
B) (1, 2, 3)
C) {'key': 'value'}
D) {1, 2, 3}
E) <1, 2, 3>
33. What does the continue statement do inside a loop?
A) Exits the loop entirely
B) Restarts the loop from the beginning
C) Skips the rest of the current iteration and moves to the next
D) Pauses the loop
E) Raises a StopIteration exception
34. Which of the following correctly defines a function with a default parameter?
A) def greet(name='World'): pass
B) def greet(name==World): pass
C) def greet(name:='World'): pass
D) def greet(default name='World'): pass
E) def greet(name<-'World'): pass
35. What is the purpose of the finally block in exception handling?
A) To catch a specific exception type
B) To run code only when no exception occurs
C) To define the exception message
D) To execute code regardless of whether an exception occurred
E) To re-raise the caught exception
36. How do you access the value associated with key 'name' in a dictionary d?
A) d.name
B) d->name
C) d{name}
D) d['name']
E) d.(name)
37. What does the __str__ method in a Python class define?
A) The class constructor behavior
B) The comparison logic between two objects
C) The string representation of an object
D) The deletion behavior of an object
E) The hashing behavior of an object
38. Which of the following is an example of abstraction in OOP?
A) Storing all attributes as public
B) Using multiple inheritance in a class hierarchy
C) Providing a simple interface while hiding complex implementation details
D) Copying methods from one class to another
E) Storing data in a list instead of a class
39. What will be the result of calling list({1, 2, 2, 3})?
A) [1, 2, 2, 3]
B) [2, 2, 3, 1]
C) A list with 3 unique elements in some order
D) [1, 2, 3, 3]
E) [{1, 2, 3}]
40. What is the output of the following: def add(a, b=5): return a + b; print(add(3))?
A) 3
B) 5
C) None
D) 8
E) Error
41. Which SQL clause is used to filter rows returned by a SELECT statement?
A) ORDER BY
B) GROUP BY
C) WHERE
D) HAVING
E) LIMIT
42. What does the SELECT statement do in SQL?
A) Deletes rows from a table
B) Creates a new table in the database
C) Retrieves data from one or more tables
D) Updates existing records in a table
E) Inserts new rows into a table
43. Which keyword is used to sort the result set of a query in ascending order by default?
A) GROUP BY
B) ORDER BY
C) SORT BY
D) ARRANGE BY
E) FILTER BY
44. What type of JOIN returns only the rows that have matching values in both tables?
A) LEFT JOIN
B) RIGHT JOIN
C) FULL OUTER JOIN
D) INNER JOIN
E) CROSS JOIN
45. Which JOIN returns all rows from the left table and the matched rows from the right table, with NULLs for unmatched right rows?
A) INNER JOIN
B) RIGHT JOIN
C) FULL OUTER JOIN
D) CROSS JOIN
E) LEFT JOIN
46. What does the COUNT() aggregate function return?
A) The sum of values in a column
B) The average value of a column
C) The number of rows matching a condition
D) The maximum value in a column
E) The minimum value in a column
47. Which aggregate function calculates the arithmetic mean of a numeric column?
A) SUM()
B) COUNT()
C) MAX()
D) AVG()
E) MIN()
48. What is the purpose of the GROUP BY clause in SQL?
A) To sort the result set by one or more columns
B) To filter individual rows before aggregation
C) To group rows sharing a common value for aggregate functions
D) To join two or more tables together
E) To limit the number of rows returned
49. Which clause is used to filter groups after applying a GROUP BY clause?
A) WHERE
B) FILTER
C) ORDER BY
D) SELECT
E) HAVING
50. What does the SUM() function do in SQL?
A) Counts the number of non-NULL values
B) Returns the highest value in a column
C) Adds up all numeric values in a specified column
D) Returns the lowest value in a column
E) Calculates the average of a column
51. Which SQL command is used to create a new table in a database?
A) INSERT INTO
B) ALTER TABLE
C) DROP TABLE
D) CREATE TABLE
E) UPDATE TABLE
52. What does the DROP TABLE statement do?
A) Removes all rows from a table but keeps its structure
B) Adds a new column to an existing table
C) Permanently deletes the table and all its data
D) Renames an existing table
E) Creates a backup copy of a table
53. Which DDL command is used to modify an existing table structure, such as adding a new column?
A) UPDATE
B) INSERT
C) CREATE
D) ALTER
E) DROP
54. What SQL statement is used to add new rows to a table?
A) UPDATE
B) DELETE
C) SELECT
D) ALTER
E) INSERT INTO
55. Which DML statement is used to modify existing records in a table?
A) INSERT
B) DELETE
C) ALTER
D) CREATE
E) UPDATE
56. What does the DELETE statement do when used without a WHERE clause?
A) Drops the entire table from the database
B) Removes only duplicate rows from the table
C) Deletes all rows from the table
D) Removes the table structure but keeps the data
E) Deletes only the first row of the table
57. What is a primary key in a relational database?
A) A column that can contain NULL values
B) A column that references another table's column
C) A unique identifier for each row in a table
D) A constraint that allows duplicate values
E) An index created automatically on foreign key columns
58. What is a foreign key used for in a relational database?
A) To uniquely identify each row in a table
B) To enforce referential integrity between two tables
C) To speed up data retrieval on a single table
D) To prevent duplicate values within a single table
E) To automatically increment a column's value
59. Which constraint ensures that a column cannot contain NULL values?
A) UNIQUE
B) PRIMARY KEY
C) DEFAULT
D) CHECK
E) NOT NULL
60. What does the UNIQUE constraint guarantee in a table column?
A) All values in the column are greater than zero
B) Values in the column cannot be updated after insertion
C) No two rows have the same value in that column
D) The column automatically generates sequential numbers
E) The column always has a default value assigned
61. What is the main purpose of an index in a database?
A) To enforce referential integrity between tables
B) To store backup copies of table data
C) To speed up data retrieval operations on a table
D) To restrict which users can access a table
E) To automatically normalize data across tables
62. Which SQL data type is best suited for storing a person's age as a whole number?
A) VARCHAR(3)
B) FLOAT
C) TEXT
D) DATE
E) INT
63. Which data type would you use to store a date such as '2024-06-15' in SQL?
A) INT
B) VARCHAR(10)
C) BOOLEAN
D) DATE
E) FLOAT
64. What is a subquery in SQL?
A) A stored procedure that runs automatically on data changes
B) A query nested inside another SQL query
C) A view that caches query results permanently
D) A special index on multiple columns
E) A trigger that executes after a DML operation
65. In which clause can a subquery be used to filter rows based on the result of another query?
A) GROUP BY
B) ORDER BY
C) CREATE
D) DROP
E) WHERE
66. What does the first normal form (1NF) require for a relational table?
A) Every non-key column must depend on the whole primary key
B) Every column must have a unique name and atomic values
C) There must be no transitive dependencies among columns
D) All tables must have at least two foreign keys
E) Data must be split across at least three related tables
67. What problem does normalization primarily aim to solve in database design?
A) Slow query execution due to missing indexes
B) Lack of constraints on primary key columns
C) Data redundancy and potential update anomalies
D) Inability to perform aggregate functions on tables
E) Missing foreign key references between tables
68. Which SQL keyword is used to sort query results in descending order?
A) ASC
B) SORT DESC
C) REVERSE
D) DESCENDING
E) DESC
69. What is the result of using RIGHT JOIN between two tables?
A) Only rows present in both tables are returned
B) All rows from the left table with NULLs for unmatched right rows
C) All rows from the right table with NULLs for unmatched left rows
D) All rows from both tables regardless of matching
E) Only rows that do not match in either table are returned
70. Which aggregate function returns the largest value in a specified column?
A) SUM()
B) COUNT()
C) AVG()
D) MIN()
E) MAX()
71. What does the MIN() function return when applied to a numeric column?
A) The total sum of all values in the column
B) The number of rows that have a non-NULL value
C) The average of all values in the column
D) The smallest value present in the column
E) The most frequently occurring value in the column
72. Which SQL clause specifies the condition that must be true for a row to be included in a GROUP BY result?
A) WHERE applied after grouping
B) ORDER BY with a condition
C) HAVING with a condition
D) LIMIT with an offset
E) SELECT DISTINCT without a filter
73. What happens if you omit the WHERE clause from an UPDATE statement?
A) The statement returns an error and makes no changes
B) Only the first row of the table is updated
C) All rows in the table are updated with the new values
D) Only rows with NULL values are updated
E) The table is deleted and recreated with updated values
74. Which of the following best describes the purpose of the INNER JOIN keyword?
A) Returns all rows from both tables, filling NULLs for non-matches
B) Returns only rows where at least one table has a match
C) Combines all rows from both tables without any condition
D) Returns rows from the left table that have no match in the right table
E) Returns only the rows where the join condition is satisfied in both tables
75. Which pandas data structure is best described as a one-dimensional labeled array capable of holding any data type?
A) DataFrame
B) Series
C) Panel
D) Index
E) MultiIndex
76. What is the correct way to create a pandas Series from a Python list called 'data'?
A) pd.Series(data)
B) pd.DataFrame(data)
C) pd.Array(data)
D) pd.List(data)
E) pd.Column(data)
77. How do you create a DataFrame from a Python dictionary where keys become column names?
A) pd.DataFrame(my_dict)
B) pd.Series(my_dict)
C) pd.read_dict(my_dict)
D) pd.from_dict(my_dict)
E) pd.table(my_dict)
78. Which function is used to read a CSV file into a pandas DataFrame?
A) pd.read_csv()
B) pd.load_csv()
C) pd.import_csv()
D) pd.open_csv()
E) pd.from_csv()
79. Which method is used to write a DataFrame to a CSV file?
A) df.to_csv()
B) df.write_csv()
C) df.save_csv()
D) df.export_csv()
E) df.dump_csv()
80. What does the 'loc' accessor in pandas use to select rows and columns?
A) Label-based indexing
B) Integer position-based indexing
C) Boolean mask only
D) Slice notation only
E) Column name only
81. What does the 'iloc' accessor in pandas use to select rows and columns?
A) Integer position-based indexing
B) Label-based indexing
C) Regex pattern matching
D) Column data type
E) Row hash value
82. Given a DataFrame 'df', how do you select only the column named 'age'?
A) df['age']
B) df.loc('age')
C) df.column('age')
D) df.select('age')
E) df.get_column('age')
83. Which expression correctly selects rows from DataFrame 'df' where the 'score' column is greater than 80?
A) df[df['score'] > 80]
B) df.where('score' > 80)
C) df.filter(score > 80)
D) df.query(score > 80)
E) df.loc('score' > 80)
84. How do you add a new column called 'total' to a DataFrame 'df'?
A) df['total'] = df['a'] + df['b']
B) df.add_column('total', df['a'] + df['b'])
C) df.insert_column('total')
D) df.new('total', df['a'] + df['b'])
E) df.append_column('total')
85. Which method removes a column named 'city' from a DataFrame 'df'?
A) df.drop('city', axis=1)
B) df.remove('city')
C) df.delete('city')
D) df.pop_column('city')
E) df.drop('city', axis=0)
86. What is the result of calling df.drop('city', axis=0) when 'city' is a column name?
A) It raises a KeyError because axis=0 refers to rows
B) It drops the column named 'city'
C) It drops all rows
D) It resets the index
E) It creates a copy without 'city'
87. Which method is used to group a DataFrame by a column and then compute the mean of each group?
A) df.groupby('col').mean()
B) df.aggregate('col', 'mean')
C) df.pivot('col').mean()
D) df.group('col').average()
E) df.groupby('col').apply_mean()
88. What does df.groupby('dept')['salary'].sum() return?
A) Total salary for each department
B) Average salary per department
C) Number of employees per department
D) Maximum salary per department
E) A list of all department names
89. Which pandas function is used to combine two DataFrames horizontally based on a common key column?
A) pd.merge()
B) pd.concat()
C) pd.join()
D) pd.combine()
E) pd.append()
90. What parameter in pd.merge() specifies which column to use as the join key when it has the same name in both DataFrames?
A) on
B) key
C) index
D) by
E) link
91. Which pd.merge() how parameter returns only rows that have matching keys in both DataFrames?
A) inner
B) outer
C) left
D) right
E) cross
92. What does pd.concat([df1, df2], axis=0) do?
A) Stacks df1 and df2 vertically (row-wise)
B) Stacks df1 and df2 horizontally (column-wise)
C) Merges df1 and df2 on index
D) Joins df1 and df2 on a common key
E) Creates a cross join of df1 and df2
93. What does pd.concat([df1, df2], axis=1) do?
A) Combines df1 and df2 side by side as new columns
B) Stacks df1 and df2 vertically
C) Merges df1 and df2 on a key column
D) Removes duplicate rows from both DataFrames
E) Joins only matching index values
94. Which method removes all rows containing at least one NaN value from a DataFrame?
A) df.dropna()
B) df.fillna()
C) df.remove_nan()
D) df.clean()
E) df.strip_nan()
95. Which method replaces all NaN values in a DataFrame with the value 0?
A) df.fillna(0)
B) df.replace_nan(0)
C) df.dropna(0)
D) df.assign_nan(0)
E) df.set_nan(0)
96. How do you check which cells in a DataFrame contain NaN values?
A) df.isna()
B) df.is_null()
C) df.check_nan()
D) df.find_nan()
E) df.missing()
97. Which method sorts a DataFrame by the 'date' column in ascending order?
A) df.sort_values('date')
B) df.sort('date')
C) df.order_by('date')
D) df.arrange('date')
E) df.sort_index('date')
98. How do you sort a DataFrame by the 'price' column in descending order?
A) df.sort_values('price', ascending=False)
B) df.sort_values('price', descending=True)
C) df.sort('price', reverse=True)
D) df.order_by('price', desc=True)
E) df.sort_values('price', order='desc')
99. What does the apply() method do when used on a DataFrame column?
A) Applies a function element-wise to each value in the column
B) Filters rows based on a condition
C) Groups the column by unique values
D) Merges the column with another DataFrame
E) Drops duplicate values in the column
100. What does df['salary'].describe() return?
A) Summary statistics including count, mean, std, min, max, and quartiles
B) A list of all unique salary values
C) The total sum of the salary column
D) A histogram of salary distribution
E) The median salary only
101. Which method returns the arithmetic mean of a numeric column in a DataFrame?
A) df['col'].mean()
B) df['col'].average()
C) df['col'].avg()
D) df['col'].central()
E) df['col'].midpoint()
102. What does df['status'].value_counts() return?
A) A Series with unique values as index and their frequency as values
B) The total count of non-null entries in 'status'
C) A DataFrame with one row per unique status value
D) A sorted list of all unique status values
E) The number of columns in the DataFrame
103. What is the shape attribute of a DataFrame used for?
A) Returns a tuple of (number of rows, number of columns)
B) Returns the total number of elements
C) Returns the column data types
D) Returns the index range
E) Returns the memory usage in bytes
104. Which method returns the first 5 rows of a DataFrame by default?
A) df.head()
B) df.top()
C) df.first()
D) df.start()
E) df.preview()
105. How do you select rows 2 through 5 (inclusive) of a DataFrame using iloc?
A) df.iloc[2:6]
B) df.iloc[2:5]
C) df.iloc[2,5]
D) df.iloc[2..5]
E) df.iloc[2:5:1]
106. Which method returns the unique values in a pandas Series?
A) series.unique()
B) series.distinct()
C) series.different()
D) series.uniq()
E) series.deduplicate()
107. What does df.reset_index() do?
A) Resets the DataFrame index to a default integer range and moves the old index to a column
B) Deletes the current index permanently
C) Sorts the DataFrame by the index column
D) Renames the index column to 'index'
E) Sets a new column as the DataFrame index
108. Which method is used to set an existing column as the index of a DataFrame?
A) df.set_index('col')
B) df.index('col')
C) df.apply_index('col')
D) df.make_index('col')
E) df.assign_index('col')
109. Which step comes first in the data analytics process?
A) Visualizing results
B) Defining the business question
C) Building predictive models
D) Cleaning the dataset
E) Presenting findings to stakeholders
110. Which type of analytics answers the question 'What happened?'
A) Predictive analytics
B) Prescriptive analytics
C) Diagnostic analytics
D) Descriptive analytics
E) Cognitive analytics
111. Which type of analytics answers the question 'Why did it happen?'
A) Descriptive analytics
B) Prescriptive analytics
C) Predictive analytics
D) Diagnostic analytics
E) Exploratory analytics
112. Which type of analytics recommends actions to achieve a desired outcome?
A) Descriptive analytics
B) Diagnostic analytics
C) Predictive analytics
D) Prescriptive analytics
E) Inferential analytics
113. Which type of analytics uses historical data to forecast future events?
A) Descriptive analytics
B) Diagnostic analytics
C) Prescriptive analytics
D) Predictive analytics
E) Reactive analytics
114. Customer satisfaction ratings collected on a scale of 1 to 5 are an example of which data type?
A) Nominal qualitative data
B) Continuous quantitative data
C) Discrete quantitative data
D) Binary qualitative data
E) Ordinal qualitative data
115. Which of the following is an example of qualitative data?
A) Number of website visits per day
B) Monthly revenue in dollars
C) Customer feedback comments
D) Temperature readings in Celsius
E) Product weight in kilograms
116. The number of support tickets resolved each day is an example of which data type?
A) Continuous quantitative
B) Ordinal qualitative
C) Nominal qualitative
D) Discrete quantitative
E) Interval qualitative
117. Which measure of central tendency is most affected by extreme outlier values?
A) Mode
B) Median
C) Geometric mean
D) Mean
E) Range
118. In a dataset, the value that appears most frequently is called the?
A) Mean
B) Median
C) Range
D) Mode
E) Variance
119. For the dataset [2, 4, 4, 6, 8], what is the median?
A) 2
B) 4.8
C) 6
D) 4
E) 3
120. Variance in a dataset measures which property of the data?
A) The most frequent value
B) The middle value when sorted
C) The spread of values around the mean
D) The difference between maximum and minimum values
E) The sum of all values divided by the count
121. Standard deviation is best described as?
A) The square of the variance
B) The average of all values in a dataset
C) The difference between the highest and lowest values
D) The square root of the variance
E) The middle value of a sorted dataset
122. A dataset has a mean of 50 and a standard deviation of 5. Most data points fall within which range according to the empirical rule?
A) 40 to 60
B) 45 to 55
C) 35 to 65
D) 30 to 70
E) 48 to 52
123. Which data cleaning step involves filling in missing values with estimated or calculated values?
A) Normalization
B) Encoding
C) Outlier removal
D) Imputation
E) Aggregation
124. Removing duplicate records from a dataset is an example of which data preprocessing task?
A) Feature engineering
B) Data imputation
C) Data deduplication
D) Data normalization
E) Data encoding
125. Converting categorical text values such as 'Yes' and 'No' into numerical values is known as?
A) Normalization
B) Imputation
C) Aggregation
D) Encoding
E) Standardization
126. Scaling all numerical features to a range between 0 and 1 is called?
A) Encoding
B) Imputation
C) Standardization
D) Min-max normalization
E) Deduplication
127. Which type of chart is most appropriate for showing the distribution of a single continuous variable?
A) Pie chart
B) Line chart
C) Scatter plot
D) Histogram
E) Bar chart
128. Which chart type is best suited for displaying the relationship between two continuous variables?
A) Pie chart
B) Histogram
C) Bar chart
D) Line chart
E) Scatter plot
129. A line chart is most commonly used to visualize which type of data?
A) Proportions of a whole
B) Frequency distribution of categories
C) Trends over time
D) Correlation between two variables
E) Geographic distribution
130. A pie chart is most appropriate when you want to show?
A) Trends over time
B) The relationship between two numerical variables
C) The distribution of a continuous variable
D) Proportions of a whole that sum to 100%
E) Frequency counts for many categories
131. Which KPI metric directly measures the percentage of visitors who make a purchase on an e-commerce website?
A) Bounce rate
B) Average session duration
C) Conversion rate
D) Customer acquisition cost
E) Net promoter score
132. KPI stands for?
A) Key Performance Indicator
B) Knowledge Processing Index
C) Key Predictive Insight
D) Known Performance Interval
E) Key Process Integration
133. A strong positive correlation between two variables means that?
A) One variable causes the other to change
B) As one variable increases, the other tends to decrease
C) The variables have no linear relationship
D) As one variable increases, the other tends to increase
E) The variables are always equal in value
134. Which statement correctly distinguishes correlation from causation?
A) Correlation proves that one variable causes changes in another
B) Causation means two variables move together without one affecting the other
C) Correlation indicates a relationship exists but does not prove one variable causes the other
D) A high correlation coefficient always implies direct causation
E) Causation and correlation are interchangeable terms in data analytics
135. In data analytics, a dashboard is best described as?
A) A raw data storage system
B) A visual display of key metrics and KPIs on a single screen
C) A statistical model used for prediction
D) A method for collecting survey responses
E) A programming environment for writing data queries
136. Which sampling method selects every nth record from a list?
A) Cluster sampling
B) Stratified sampling
C) Convenience sampling
D) Simple random sampling
E) Systematic sampling
137. Stratified sampling involves?
A) Selecting records at fixed intervals from a list
B) Dividing the population into subgroups and sampling from each
C) Choosing any available participants without a structured plan
D) Randomly assigning all members an equal chance of selection
E) Selecting entire groups rather than individuals
138. Which term describes making business decisions based on analysis of data rather than intuition alone?
A) Anecdotal decision making
B) Intuitive management
C) Data-driven decision making
D) Heuristic processing
E) Reactive planning
139. Which of the following is an example of a leading KPI?
A) Total revenue for last quarter
B) Number of customer complaints received
C) Employee turnover rate for the past year
D) Number of new sales leads generated this month
E) Net profit margin reported annually
140. In data preprocessing, an outlier is best described as?
A) A value that is missing from the dataset
B) A duplicate record in the dataset
C) A data point that differs significantly from other observations
D) A categorical value that has been incorrectly encoded
E) A value that falls exactly on the mean
141. Which descriptive statistic describes the difference between the maximum and minimum values in a dataset?
A) Variance
B) Standard deviation
C) Mode
D) Range
E) Mean
142. Which step in the data analytics process involves communicating findings to stakeholders using visuals and summaries?
A) Data collection
B) Data cleaning
C) Statistical modeling
D) Data reporting and presentation
E) Sampling design
143. What does CI stand for in the context of CI/CD pipelines?
A) Continuous Integration
B) Continuous Infrastructure
C) Code Inspection
D) Container Initialization
E) Centralized Implementation
144. Which command creates a new branch called 'feature' and switches to it in Git?
A) git checkout -b feature
B) git branch -m feature
C) git switch --create-new feature
D) git init feature
E) git clone -b feature
145. What is the primary purpose of a Dockerfile?
A) To define the instructions for building a Docker container image
B) To configure a Kubernetes cluster
C) To store environment variables for a running container
D) To schedule automated deployments
E) To manage container networking rules
146. In Git, what does the 'git merge' command do?
A) Combines changes from one branch into the current branch
B) Deletes a remote branch after review
C) Pushes local commits to the remote repository
D) Creates a snapshot of the current working directory
E) Reverts the last commit made to the repository
147. What is the main goal of the CD part in a CI/CD pipeline?
A) To automate the delivery or deployment of software to environments
B) To check code formatting before committing
C) To manage Docker image layers
D) To monitor application logs in real time
E) To run unit tests before code review
148. Which Git command uploads local branch commits to a remote repository?
A) git push
B) git fetch
C) git pull
D) git commit
E) git rebase
149. What is a pull request (PR) in a Git-based workflow?
A) A request to merge changes from one branch into another, typically reviewed by peers
B) A command that downloads the latest changes from a remote repository
C) A way to delete an outdated branch from the repository
D) An automated script that runs tests on new commits
E) A notification sent when a deployment fails in production
150. Which of the following best describes a Docker container?
A) A lightweight, isolated runtime environment that runs an application and its dependencies
B) A virtual machine with a full operating system installed
C) A configuration file that defines cloud infrastructure resources
D) A tool for monitoring CPU and memory usage of services
E) A network protocol for connecting microservices together
151. What is the purpose of the 'staging' environment in a typical software deployment pipeline?
A) To simulate production conditions and validate the application before final release
B) To store raw source code before it is compiled
C) To run developer unit tests on local machines
D) To automatically scale containers during peak load
E) To host the live version of the application for end users
152. What does Infrastructure as Code (IaC) mean?
A) Managing and provisioning infrastructure through machine-readable configuration files rather than manual processes
B) Writing application logic directly inside Docker containers
C) Using Git to track changes in database schemas
D) Building CI/CD pipelines using only shell scripts
E) Storing server passwords in encrypted code repositories
153. Which tool is most commonly associated with Infrastructure as Code?
A) Terraform
B) Jenkins
C) Grafana
D) Prometheus
E) Ansible only for IaC
154. In Kubernetes, what is a Pod?
A) The smallest deployable unit that can contain one or more containers
B) A configuration file describing network routing rules
C) A type of persistent storage volume for databases
D) A load balancer that distributes traffic to nodes
E) A monitoring dashboard for cluster resources
155. What is the purpose of the 'git commit' command?
A) To save staged changes as a new snapshot in the local repository history
B) To send local changes directly to a remote server
C) To merge two branches together in the repository
D) To download updates from a remote repository
E) To create a new branch from the current HEAD
156. Which deployment strategy releases a new version to a small subset of users before rolling it out to everyone?
A) Canary deployment
B) Blue-green deployment
C) Rolling deployment
D) Recreate deployment
E) Shadow deployment
157. In a CI/CD pipeline, what happens during the 'build' stage?
A) Source code is compiled and packaged into an executable artifact
B) Automated tests are executed against the application
C) The application is deployed to the production server
D) Container images are pushed to a registry
E) Infrastructure resources are provisioned in the cloud
158. What does the 'git pull' command do?
A) Fetches changes from a remote repository and merges them into the current local branch
B) Sends local commits to a remote branch
C) Deletes the remote tracking branch reference
D) Creates a new branch from a remote repository
E) Stages all modified files for the next commit
159. What is the key difference between blue-green and canary deployment strategies?
A) Blue-green switches all traffic at once to a new environment, while canary gradually shifts traffic
B) Blue-green uses containers while canary uses virtual machines
C) Blue-green is only for databases while canary is for web services
D) Blue-green requires Kubernetes while canary works only on bare metal
E) Blue-green rolls back automatically while canary requires manual intervention
160. Which command is used to view the commit history in Git?
A) git log
B) git status
C) git diff
D) git show
E) git history
161. What is a container image in Docker?
A) A read-only template used to create containers, containing the application and its dependencies
B) A running instance of an application inside Docker
C) A network configuration file for container communication
D) A script that automates the startup of Docker services
E) A log file generated when a container exits unexpectedly
162. What is the main benefit of DevOps culture in software development?
A) Breaking down silos between development and operations teams to improve collaboration and delivery speed
B) Replacing all manual testing with fully automated scripts
C) Ensuring every developer works only on isolated tasks without team interaction
D) Eliminating the need for version control in modern projects
E) Focusing exclusively on infrastructure management rather than application code
163. In Git, what does 'git stash' do?
A) Temporarily saves uncommitted changes so you can work on something else
B) Permanently deletes untracked files from the working directory
C) Pushes all local commits to the remote repository
D) Creates a backup copy of the entire repository
E) Merges stashed branches into the main branch
164. What is Kubernetes primarily used for?
A) Orchestrating and managing containerized applications across a cluster of machines
B) Building Docker images from source code
C) Writing Infrastructure as Code configuration files
D) Monitoring application logs and generating alerts
E) Providing a GUI interface for Git repository management
165. Which of the following is a common use of monitoring in a DevOps pipeline?
A) Detecting performance issues and errors in running applications to trigger alerts
B) Automatically merging pull requests after code review approval
C) Generating Docker images from application source code
D) Defining reusable templates for cloud infrastructure
E) Assigning tasks to developers based on commit history
166. What is the purpose of a container registry such as Docker Hub?
A) To store, manage, and distribute Docker container images
B) To orchestrate containers across multiple servers
C) To write and execute Infrastructure as Code scripts
D) To monitor the health of running containers
E) To manage Git branches and pull requests remotely
167. In DevOps, what does 'logging' typically refer to?
A) Recording events and messages generated by an application for troubleshooting and auditing
B) Committing code changes to a version control repository
C) Scheduling automated deployment jobs in a CI/CD pipeline
D) Tracking the number of Docker containers running in a cluster
E) Storing container image layers in a remote registry
168. What is the role of a CI/CD pipeline's 'test' stage?
A) To automatically run automated tests to verify that code changes do not break existing functionality
B) To compile the source code into a deployable artifact
C) To push the container image to the production registry
D) To configure environment variables for the deployment environment
E) To create new branches for each feature under development
169. Which Git workflow concept involves creating a short-lived branch for a specific feature and merging it back after review?
A) Feature branch workflow
B) Centralized workflow
C) Gitflow with long-lived release branches
D) Forking workflow
E) Trunk-based deployment workflow
170. What is the primary purpose of environment variables in a containerized application?
A) To provide configuration values to the application without hardcoding them in the source code
B) To define the network topology between containers
C) To specify the CPU and memory limits for each container
D) To store the Docker image layers in a compressed format
E) To list all running containers on the host machine
171. In Kubernetes, what does a 'Deployment' resource manage?
A) The desired state of a set of Pods, including replicas and update strategies
B) The persistent storage volumes attached to a cluster node
C) The DNS configuration for services within the cluster
D) The authentication credentials for accessing the container registry
E) The logging pipeline that collects logs from all nodes
172. What does the command 'docker run' do?
A) Creates and starts a new container from a specified image
B) Builds a new Docker image from a Dockerfile
C) Pushes a local image to a remote Docker registry
D) Stops all currently running containers on the host
E) Lists all Docker images stored locally on the machine
173. Which of the following best describes the 'dev' environment in a deployment pipeline?
A) A local or shared environment where developers actively write and test new code changes
B) The final environment where end users access the live application
C) An environment that exactly mirrors production for pre-release validation
D) A read-only environment used for generating audit reports
E) A cloud environment dedicated to running load and stress tests
174. What is the purpose of a '.gitignore' file in a repository?
A) To specify files and directories that Git should not track or include in commits
B) To list all contributors who have write access to the repository
C) To define the branching strategy enforced across the project
D) To store encrypted credentials used by CI/CD pipelines
E) To configure the remote repository URL for push operations
175. In a DevOps context, what does 'automation' primarily aim to achieve?
A) Reducing manual, repetitive tasks to increase speed, consistency, and reliability of software delivery
B) Replacing all human developers with AI-generated code
C) Limiting the number of commits a developer can make per day
D) Preventing any changes to the production environment without written approval
E) Ensuring that all code is written in a single programming language
176. What is a key advantage of using Docker containers compared to traditional virtual machines?
A) Containers share the host OS kernel and start faster with lower resource overhead than full virtual machines
B) Containers provide stronger security isolation by running separate operating system kernels
C) Containers cannot be moved between different host machines unlike virtual machines
D) Containers require a hypervisor to manage hardware resources on the host
E) Containers always use more disk space because they bundle a complete OS
177. What is the primary purpose of the Kanban method in software development?
A) To assign fixed roles to every team member
B) To visualize work and limit work in progress to improve flow
C) To define strict sprint durations for delivery cycles
D) To replace daily standups with weekly planning meetings
E) To automate deployment pipelines for continuous delivery
178. Which of the following best describes a Kanban board?
A) A burndown chart showing remaining story points per sprint
B) A visual tool that displays work items as they move through workflow stages
C) A Gantt chart tracking project milestones and deadlines
D) A spreadsheet listing all team members and their assigned tasks
E) A dashboard showing server uptime and performance metrics
179. What does a column on a Kanban board typically represent?
A) A team member responsible for completing tasks
B) A specific stage or state in the work process
C) The total number of hours spent on a project
D) A customer requirement or user story
E) A sprint backlog item waiting for prioritization
180. What is a Kanban card primarily used for?
A) Tracking the total budget allocated to a project
B) Representing a single work item or task moving through the workflow
C) Scheduling team meetings and retrospectives
D) Defining acceptance criteria for the entire product
E) Recording the velocity of the development team per sprint
181. What does WIP stand for in the context of Kanban?
A) Work In Progress
B) Work Item Priority
C) Workflow Integration Process
D) Weekly Implementation Plan
E) Work Iteration Protocol
182. What is the main benefit of setting WIP limits on a Kanban board?
A) They ensure that every developer works on multiple tasks simultaneously
B) They prevent teams from starting new work before finishing existing work, reducing bottlenecks
C) They automatically assign tasks to the least busy team member
D) They replace the need for a product owner in the team
E) They increase the number of features delivered in each release
183. In a pull system used by Kanban, how does work move to the next stage?
A) The manager pushes tasks to developers based on a schedule
B) A worker pulls a new item only when they have capacity to handle it
C) All tasks are automatically moved at the end of each sprint
D) The customer requests work items directly from the backlog
E) Tasks are pushed forward as soon as they are created
184. Which of the following best describes the Kanban principle of visualizing work?
A) Creating detailed UML diagrams for every software component
B) Making the state and progress of all work items visible to the entire team
C) Using color-coded Gantt charts to track project timelines
D) Publishing weekly status reports to stakeholders via email
E) Drawing flowcharts to document business processes
185. What does 'continuous flow' mean in Kanban?
A) Deploying code to production every day without testing
B) Work items move smoothly through the workflow without interruptions or large batches
C) Holding continuous sprint ceremonies without breaks between iterations
D) Running automated tests continuously in the CI/CD pipeline
E) Assigning new tasks to developers as soon as a sprint ends
186. How is lead time defined in Kanban?
A) The time a developer spends actively coding a single feature
B) The total time from when a work item is requested to when it is delivered
C) The duration of a single sprint from planning to review
D) The time it takes to deploy code to a production server
E) The number of days between two consecutive team retrospectives
187. How does cycle time differ from lead time in Kanban?
A) Cycle time measures total wait time; lead time measures active work time
B) Cycle time is the time work is actively being done; lead time includes waiting time before work begins
C) They are identical metrics and can be used interchangeably
D) Cycle time measures team velocity; lead time measures customer satisfaction
E) Cycle time applies only to bugs; lead time applies only to new features
188. What does a Cumulative Flow Diagram (CFD) display?
A) The total number of bugs found during each sprint
B) The number of work items in each workflow stage over time, shown as stacked areas
C) A comparison of planned versus actual story points per iteration
D) The team's velocity trend across multiple sprints
E) A burndown of remaining backlog items in a release
189. On a Cumulative Flow Diagram, what does a widening band for a particular column indicate?
A) The team is completing work faster than expected in that stage
B) Work items are accumulating in that stage, suggesting a bottleneck
C) The number of team members working in that stage has increased
D) Customer requirements are being added to the backlog more rapidly
E) The team has successfully reduced WIP limits in that column
190. What is a bottleneck in a Kanban workflow?
A) A stage where work items pile up, slowing the overall flow through the system
B) A mandatory code review step required before deployment
C) A sprint planning meeting that takes longer than expected
D) A technical debt item that blocks new feature development
E) A WIP limit set too high for the current team capacity
191. Which Kanban principle states that you should make process policies explicit?
A) Limit work in progress to avoid multitasking
B) Visualize the workflow on a board for transparency
C) Clearly define and communicate the rules governing how work flows through the system
D) Implement feedback loops through regular retrospectives
E) Manage flow by tracking lead time and cycle time metrics
192. What is a 'class of service' in Kanban?
A) A category that defines how different types of work items are prioritized and handled
B) A training course level for developers joining the team
C) A column on the Kanban board reserved for senior developers
D) A service-level agreement with external software vendors
E) A type of customer subscription tier in a SaaS product
193. Which class of service is typically used for work items that must be resolved immediately due to critical business impact?
A) Standard
B) Fixed date
C) Intangible
D) Expedite
E) Deferred
194. In Kanban, what is the role of feedback loops such as regular reviews?
A) To assign blame when work items are delivered late
B) To continuously improve the process by reflecting on performance and flow
C) To replace the need for a daily standup meeting
D) To increase the WIP limits when the team feels overwhelmed
E) To formally approve work items before they enter the workflow
195. Which statement about Kanban and Scrum is correct?
A) Kanban prescribes fixed-length iterations called sprints; Scrum does not
B) Scrum uses time-boxed sprints; Kanban focuses on continuous flow without fixed iterations
C) Both Kanban and Scrum require a Scrum Master to function properly
D) Kanban requires a product backlog; Scrum does not
E) Scrum has no defined roles; Kanban requires a team lead
196. Which of the following is a core Scrum artifact that Kanban does not require?
A) A visual board showing work item status
B) A product backlog maintained by a product owner
C) A system for limiting work in progress
D) A pull-based approach to moving tasks
E) A method for tracking lead time and cycle time
197. How does Kanban handle changes to work in progress compared to Scrum?
A) Kanban prohibits any changes once work starts, similar to Scrum sprints
B) Kanban allows changes and reprioritization at any time; Scrum protects the sprint from changes
C) Both methods allow unlimited changes during active development cycles
D) Scrum allows continuous reprioritization; Kanban freezes the backlog for a week
E) Kanban requires a change request form; Scrum does not
198. What happens when a WIP limit is reached on a Kanban board?
A) The team increases the WIP limit automatically to accommodate new tasks
B) No new work items can enter that column until existing items move forward
C) The project manager assigns additional developers to the overloaded stage
D) The sprint is ended early and a new planning session is held
E) All blocked items are moved directly to the done column
199. Which metric would you use in Kanban to predict when a work item will be completed?
A) Team velocity measured in story points per sprint
B) Lead time and cycle time data from historical flow metrics
C) The number of story points remaining in the product backlog
D) The total number of tasks assigned to each developer
E) The burn rate calculated from the sprint burndown chart
200. What does it mean to 'pull' work in a Kanban system?
A) A team member takes a new task only when they finish their current work and have available capacity
B) The project manager assigns tasks to developers based on a priority queue
C) Customers submit feature requests that are automatically added to the board
D) The CI/CD pipeline automatically deploys completed features to production
E) Work items are moved backward to a previous column for rework
201. In Kanban, what is the purpose of a 'Ready' or 'Next' column before the active work column?
A) To store completed items waiting for customer approval before archiving
B) To hold items that have been prepared and prioritized, ready to be pulled into active work
C) To list bugs found during testing that must be fixed in the next sprint
D) To display work items that have been rejected by the product owner
E) To track items blocked by external dependencies outside the team's control
202. Which of the following best describes the Kanban principle of 'evolving processes collaboratively'?
A) The team manager unilaterally decides and enforces all process changes
B) The team experiments with and agrees on incremental improvements to the workflow together
C) All process changes must be approved by an external Kanban consultant
D) Process rules are fixed at project start and cannot be modified during delivery
E) Only senior developers participate in decisions about workflow improvements
203. What is the relationship between WIP limits and lead time in a Kanban system?
A) Higher WIP limits always result in shorter lead times due to parallelism
B) Lower WIP limits generally lead to shorter lead times by reducing queue lengths
C) WIP limits have no measurable effect on lead time or cycle time
D) Lead time increases when WIP limits are reduced because fewer tasks are processed
E) WIP limits only affect cycle time and have no impact on lead time
204. Which of the following is NOT a typical column found on a basic Kanban board?
A) To Do
B) In Progress
C) Done
D) Sprint Backlog
E) Review
205. What is the primary goal of the Agile Manifesto published in 2001?
A) To define a strict project management process with fixed phases
B) To provide guiding values and principles for flexible software development
C) To replace all existing software methodologies with a single standard
D) To establish a certification framework for software developers
E) To create a legal agreement between developers and clients
206. Which of the following is one of the four core values stated in the Agile Manifesto?
A) Comprehensive documentation over working software
B) Contract negotiation over customer collaboration
C) Individuals and interactions over processes and tools
D) Following a plan over responding to change
E) Strict deadlines over team flexibility
207. According to the Agile Manifesto, what is valued more than comprehensive documentation?
A) Customer collaboration
B) Contract negotiation
C) Following a plan
D) Working software
E) Processes and tools
208. How many principles are listed in the Agile Manifesto to support its four core values?
A) 4
B) 8
C) 10
D) 12
E) 16
209. Which Agile principle states that working software should be delivered frequently?
A) Deliver working software from a few weeks to a few months, with a preference to shorter timescale
B) Deliver working software only after the full product is complete
C) Deliver software updates once per year to minimize disruption
D) Deliver documentation first so the team can plan properly
E) Deliver software only after all requirements are finalized
210. What does 'iterative development' mean in an Agile context?
A) Building the entire product once and then testing it
B) Releasing software only after all features are implemented
C) Repeatedly refining the product through multiple cycles of development
D) Writing detailed requirements before starting any coding
E) Assigning each developer to a single feature from start to finish
211. What does 'incremental development' mean in software projects?
A) Developing all features simultaneously in one large release
B) Delivering the product in small, usable pieces that build upon each other
C) Waiting until the end of the project to integrate all components
D) Increasing the number of developers each sprint
E) Incrementally increasing the project budget as features are added
212. What is the role of the Product Owner in Scrum?
A) To facilitate daily standups and remove team impediments
B) To write all the code for the highest-priority features
C) To manage the Product Backlog and represent stakeholder interests
D) To create the sprint schedule and assign tasks to developers
E) To conduct performance reviews for the Development Team
213. What is the primary responsibility of the Scrum Master?
A) Managing the product vision and defining requirements
B) Coding the most complex features in the sprint
C) Ensuring the Scrum process is followed and removing impediments
D) Approving the final release of the product increment
E) Negotiating contracts with external vendors
214. Which statement best describes the Scrum Development Team?
A) A group of specialists each responsible for exactly one layer of the application
B) A self-organizing, cross-functional team that delivers the product increment
C) A team led by a senior developer who assigns all tasks
D) A temporary group assembled only for testing purposes
E) A department of designers who create the UI before developers begin coding
215. What is a Sprint in Scrum?
A) A final release event held at the end of the project
B) A time-boxed iteration, typically one to four weeks, in which a usable increment is created
C) A daily meeting where team members report their progress
D) A phase in which requirements are gathered from stakeholders
E) An unplanned period of extra work to fix critical bugs
216. What is the typical duration of a Sprint in Scrum?
A) One day to one week
B) One to four weeks
C) Two to six months
D) Exactly thirty days
E) One full quarter (three months)
217. What happens during Sprint Planning?
A) The team reviews the completed increment with stakeholders
B) The team reflects on the previous sprint to identify improvements
C) The team selects backlog items and plans the work to be done in the upcoming sprint
D) The Product Owner writes all the user stories for the next quarter
E) The Scrum Master assigns individual tasks to each developer
218. What is the purpose of the Daily Scrum?
A) To present the finished sprint increment to the Product Owner
B) To update the project plan with newly discovered requirements
C) To allow the team to inspect progress and adapt the plan for the next 24 hours
D) To formally approve completed user stories before they can be tested
E) To hold a retrospective on team performance and process issues
219. How long should a Daily Scrum typically last?
A) 15 minutes
B) 30 minutes
C) 1 hour
D) 2 hours
E) As long as needed to resolve all blockers
220. What is the main purpose of the Sprint Review?
A) To discuss what went wrong in the sprint and how to improve
B) To assign story points to backlog items for the next sprint
C) To inspect the increment and gather feedback from stakeholders
D) To update the Definition of Done based on team performance
E) To re-estimate all remaining Product Backlog items
221. What is the Sprint Retrospective focused on?
A) Demonstrating the completed product increment to stakeholders
B) Planning the work items for the upcoming sprint
C) Inspecting how the team worked together and identifying process improvements
D) Reviewing customer requirements for the next product release
E) Estimating the velocity for the next three sprints
222. What is the Product Backlog in Scrum?
A) A list of bugs found during the current sprint
B) An ordered list of everything that might be needed in the product
C) A log of all code commits made during a sprint
D) A document that replaces the traditional project requirements specification
E) A schedule of all sprints planned for the entire project
223. What is the Sprint Backlog?
A) All items that were rejected by the Product Owner this sprint
B) The set of Product Backlog items selected for the sprint plus a plan for delivering the increment
C) A list of features the team was unable to complete in the previous sprint
D) A ranked list of all features across all future sprints
E) The final release notes for the current sprint's increment
224. What is an Increment in Scrum?
A) The total number of story points completed across all sprints
B) The sum of all Product Backlog items completed during the sprint that meets the Definition of Done
C) A partial build of the product that has not yet been tested
D) The list of features planned but not yet started
E) A document describing what will be built in the next sprint
225. What is a user story in Agile development?
A) A technical specification written by architects before coding begins
B) A short, informal description of a feature from the perspective of the end user
C) A formal contract between the client and the development team
D) A detailed test case used to verify feature functionality
E) A log entry recording the time a developer spent on a task
226. Which template is most commonly used to write a user story?
A) As a [user type], I want [goal] so that [benefit]
B) Given [context], when [action], then [outcome]
C) Feature: [name], Scenario: [description], Steps: [list]
D) Title: [feature], Priority: [level], Effort: [hours]
E) Requirement ID: [id], Description: [text], Acceptance: [criteria]
227. What are story points used for in Agile?
A) Tracking the exact number of hours each developer worked
B) Estimating the relative size and complexity of user stories
C) Counting the number of lines of code written per sprint
D) Measuring the quality of the product increment after testing
E) Assigning monetary cost to each feature in the product backlog
228. What does 'velocity' mean in a Scrum team context?
A) The speed at which individual developers write code
B) The average number of story points the team completes per sprint
C) The total number of sprints completed since the project started
D) The rate at which new bugs are discovered during testing
E) The maximum number of user stories allowed in a single sprint
229. How is a team's velocity typically used?
A) To evaluate individual developer performance during reviews
B) To forecast how much work the team can complete in future sprints
C) To determine the salary of each Scrum team member
D) To calculate the exact release date guaranteed to stakeholders
E) To assign blame when sprint goals are not met
230. What is the Definition of Done (DoD) in Scrum?
A) A list of features that the Product Owner has approved for release
B) A shared agreement describing what criteria a backlog item must meet to be considered complete
C) A document signed by the client confirming acceptance of the product
D) The set of user stories selected for the current sprint
E) A checklist of tasks assigned to the Scrum Master each day
231. Which of the following best describes the Waterfall software development model?
A) Development occurs in overlapping, iterative cycles with continuous feedback
B) Work is divided into sprints of equal length with defined roles
C) Phases are completed sequentially, with each phase starting only after the previous one ends
D) Teams self-organize and adapt requirements throughout the project
E) Releases are made incrementally every one to four weeks
232. What is a key difference between Agile and Waterfall approaches?
A) Waterfall encourages frequent releases while Agile uses a single release
B) Agile welcomes changing requirements even late in development; Waterfall treats changes as costly
C) Agile requires more documentation than Waterfall before development begins
D) Waterfall involves daily team meetings while Agile does not
E) Agile assigns all requirements upfront while Waterfall allows flexibility
233. In which situation is a Waterfall approach generally considered more suitable than Agile?
A) When requirements are expected to change frequently throughout the project
B) When the team is small and co-located with daily access to the customer
C) When requirements are well-understood, stable, and unlikely to change significantly
D) When the product needs to be released in small increments every few weeks
E) When the project involves rapid prototyping and user feedback loops
234. Which Scrum artifact is the responsibility of the entire Development Team to update during the sprint?
A) Product Backlog
B) Sprint Backlog
C) Release Plan
D) Project Charter
E) Definition of Ready
`,
  answers: [
  "_count",
  "float",
  "3",
  "**",
  "False",
  "def",
  "[]",
  "5",
  "0",
  "break",
  "<class 'list'>",
  "tuple",
  "[0, 1, 2, 3, 4]",
  "except",
  "Does nothing and acts as a placeholder",
  "from math import sqrt",
  "8",
  "append()",
  "3",
  "Tuples are immutable while lists are mutable",
  "[x**2 for x in range(5)]",
  "The instance of the class",
  "__init__",
  "Bundling data and methods that operate on that data within one unit",
  "class Dog(Animal): pass",
  "Objects of different classes to be used through the same interface",
  "5",
  "global x",
  "except Exception:",
  "dictionary.keys()",
  "yth",
  "{1, 2, 3}",
  "Skips the rest of the current iteration and moves to the next",
  "def greet(name='World'): pass",
  "To execute code regardless of whether an exception occurred",
  "d['name']",
  "The string representation of an object",
  "Providing a simple interface while hiding complex implementation details",
  "A list with 3 unique elements in some order",
  "8",
  "WHERE",
  "Retrieves data from one or more tables",
  "ORDER BY",
  "INNER JOIN",
  "LEFT JOIN",
  "The number of rows matching a condition",
  "AVG()",
  "To group rows sharing a common value for aggregate functions",
  "HAVING",
  "Adds up all numeric values in a specified column",
  "CREATE TABLE",
  "Permanently deletes the table and all its data",
  "ALTER",
  "INSERT INTO",
  "UPDATE",
  "Deletes all rows from the table",
  "A unique identifier for each row in a table",
  "To enforce referential integrity between two tables",
  "NOT NULL",
  "No two rows have the same value in that column",
  "To speed up data retrieval operations on a table",
  "INT",
  "DATE",
  "A query nested inside another SQL query",
  "WHERE",
  "Every column must have a unique name and atomic values",
  "Data redundancy and potential update anomalies",
  "DESC",
  "All rows from the right table with NULLs for unmatched left rows",
  "MAX()",
  "The smallest value present in the column",
  "HAVING with a condition",
  "All rows in the table are updated with the new values",
  "Returns only the rows where the join condition is satisfied in both tables",
  "Series",
  "pd.Series(data)",
  "pd.DataFrame(my_dict)",
  "pd.read_csv()",
  "df.to_csv()",
  "Label-based indexing",
  "Integer position-based indexing",
  "df['age']",
  "df[df['score'] > 80]",
  "df['total'] = df['a'] + df['b']",
  "df.drop('city', axis=1)",
  "It raises a KeyError because axis=0 refers to rows",
  "df.groupby('col').mean()",
  "Total salary for each department",
  "pd.merge()",
  "on",
  "inner",
  "Stacks df1 and df2 vertically (row-wise)",
  "Combines df1 and df2 side by side as new columns",
  "df.dropna()",
  "df.fillna(0)",
  "df.isna()",
  "df.sort_values('date')",
  "df.sort_values('price', ascending=False)",
  "Applies a function element-wise to each value in the column",
  "Summary statistics including count, mean, std, min, max, and quartiles",
  "df['col'].mean()",
  "A Series with unique values as index and their frequency as values",
  "Returns a tuple of (number of rows, number of columns)",
  "df.head()",
  "df.iloc[2:6]",
  "series.unique()",
  "Resets the DataFrame index to a default integer range and moves the old index to a column",
  "df.set_index('col')",
  "Defining the business question",
  "Descriptive analytics",
  "Diagnostic analytics",
  "Prescriptive analytics",
  "Predictive analytics",
  "Ordinal qualitative data",
  "Customer feedback comments",
  "Discrete quantitative",
  "Mean",
  "Mode",
  "4",
  "The spread of values around the mean",
  "The square root of the variance",
  "40 to 60",
  "Imputation",
  "Data deduplication",
  "Encoding",
  "Min-max normalization",
  "Histogram",
  "Scatter plot",
  "Trends over time",
  "Proportions of a whole that sum to 100%",
  "Conversion rate",
  "Key Performance Indicator",
  "As one variable increases, the other tends to increase",
  "Correlation indicates a relationship exists but does not prove one variable causes the other",
  "A visual display of key metrics and KPIs on a single screen",
  "Systematic sampling",
  "Dividing the population into subgroups and sampling from each",
  "Data-driven decision making",
  "Number of new sales leads generated this month",
  "A data point that differs significantly from other observations",
  "Range",
  "Data reporting and presentation",
  "Continuous Integration",
  "git checkout -b feature",
  "To define the instructions for building a Docker container image",
  "Combines changes from one branch into the current branch",
  "To automate the delivery or deployment of software to environments",
  "git push",
  "A request to merge changes from one branch into another, typically reviewed by peers",
  "A lightweight, isolated runtime environment that runs an application and its dependencies",
  "To simulate production conditions and validate the application before final release",
  "Managing and provisioning infrastructure through machine-readable configuration files rather than manual processes",
  "Terraform",
  "The smallest deployable unit that can contain one or more containers",
  "To save staged changes as a new snapshot in the local repository history",
  "Canary deployment",
  "Source code is compiled and packaged into an executable artifact",
  "Fetches changes from a remote repository and merges them into the current local branch",
  "Blue-green switches all traffic at once to a new environment, while canary gradually shifts traffic",
  "git log",
  "A read-only template used to create containers, containing the application and its dependencies",
  "Breaking down silos between development and operations teams to improve collaboration and delivery speed",
  "Temporarily saves uncommitted changes so you can work on something else",
  "Orchestrating and managing containerized applications across a cluster of machines",
  "Detecting performance issues and errors in running applications to trigger alerts",
  "To store, manage, and distribute Docker container images",
  "Recording events and messages generated by an application for troubleshooting and auditing",
  "To automatically run automated tests to verify that code changes do not break existing functionality",
  "Feature branch workflow",
  "To provide configuration values to the application without hardcoding them in the source code",
  "The desired state of a set of Pods, including replicas and update strategies",
  "Creates and starts a new container from a specified image",
  "A local or shared environment where developers actively write and test new code changes",
  "To specify files and directories that Git should not track or include in commits",
  "Reducing manual, repetitive tasks to increase speed, consistency, and reliability of software delivery",
  "Containers share the host OS kernel and start faster with lower resource overhead than full virtual machines",
  "To visualize work and limit work in progress to improve flow",
  "A visual tool that displays work items as they move through workflow stages",
  "A specific stage or state in the work process",
  "Representing a single work item or task moving through the workflow",
  "Work In Progress",
  "They prevent teams from starting new work before finishing existing work, reducing bottlenecks",
  "A worker pulls a new item only when they have capacity to handle it",
  "Making the state and progress of all work items visible to the entire team",
  "Work items move smoothly through the workflow without interruptions or large batches",
  "The total time from when a work item is requested to when it is delivered",
  "Cycle time is the time work is actively being done; lead time includes waiting time before work begins",
  "The number of work items in each workflow stage over time, shown as stacked areas",
  "Work items are accumulating in that stage, suggesting a bottleneck",
  "A stage where work items pile up, slowing the overall flow through the system",
  "Clearly define and communicate the rules governing how work flows through the system",
  "A category that defines how different types of work items are prioritized and handled",
  "Expedite",
  "To continuously improve the process by reflecting on performance and flow",
  "Scrum uses time-boxed sprints; Kanban focuses on continuous flow without fixed iterations",
  "A product backlog maintained by a product owner",
  "Kanban allows changes and reprioritization at any time; Scrum protects the sprint from changes",
  "No new work items can enter that column until existing items move forward",
  "Lead time and cycle time data from historical flow metrics",
  "A team member takes a new task only when they finish their current work and have available capacity",
  "To hold items that have been prepared and prioritized, ready to be pulled into active work",
  "The team experiments with and agrees on incremental improvements to the workflow together",
  "Lower WIP limits generally lead to shorter lead times by reducing queue lengths",
  "Sprint Backlog",
  "To provide guiding values and principles for flexible software development",
  "Individuals and interactions over processes and tools",
  "Working software",
  "12",
  "Deliver working software from a few weeks to a few months, with a preference to shorter timescale",
  "Repeatedly refining the product through multiple cycles of development",
  "Delivering the product in small, usable pieces that build upon each other",
  "To manage the Product Backlog and represent stakeholder interests",
  "Ensuring the Scrum process is followed and removing impediments",
  "A self-organizing, cross-functional team that delivers the product increment",
  "A time-boxed iteration, typically one to four weeks, in which a usable increment is created",
  "One to four weeks",
  "The team selects backlog items and plans the work to be done in the upcoming sprint",
  "To allow the team to inspect progress and adapt the plan for the next 24 hours",
  "15 minutes",
  "To inspect the increment and gather feedback from stakeholders",
  "Inspecting how the team worked together and identifying process improvements",
  "An ordered list of everything that might be needed in the product",
  "The set of Product Backlog items selected for the sprint plus a plan for delivering the increment",
  "The sum of all Product Backlog items completed during the sprint that meets the Definition of Done",
  "A short, informal description of a feature from the perspective of the end user",
  "As a [user type], I want [goal] so that [benefit]",
  "Estimating the relative size and complexity of user stories",
  "The average number of story points the team completes per sprint",
  "To forecast how much work the team can complete in future sprints",
  "A shared agreement describing what criteria a backlog item must meet to be considered complete",
  "Phases are completed sequentially, with each phase starting only after the previous one ends",
  "Agile welcomes changing requirements even late in development; Waterfall treats changes as costly",
  "When requirements are well-understood, stable, and unlikely to change significantly",
  "Sprint Backlog"
]
};
