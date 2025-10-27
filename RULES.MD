## Rules
1:  Directory name will always follow small case and if two or more words are present camelCase `auth`,

2:  component names will always follow Pascal case `Component.jsx`, `ComponentHello.jsx`
    File Organization: Each component should ideally have its own directory if it has multiple associated files (e.g., CSS, tests).
    
3:  non component file names will always follow camelCase `auth.js`, `dateTime.js`.

4:  variable and function name rules are enforced using eslint: CamelCase - [airbnb rule]

5:  Prop Drilling Avoidance: Use Redux to avoid passing props deeply through component trees.

6:  use constant files to define and reuse any static data that is being reused.

