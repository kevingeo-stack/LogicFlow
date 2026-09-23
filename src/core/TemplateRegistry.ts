import { FlowTemplate, TemplateCategory } from '../types';

export const templatesRegistry: FlowTemplate[] = [
  // Básicas
  {
    id: 'tpl-hello-world',
    titleKey: 'templates.items.helloWorld.title',
    descriptionKey: 'templates.items.helloWorld.desc',
    category: 'basics',
    supportedLanguages: ['python', 'javascript', 'cpp', 'java'],
    sourceCode: {
      python: `print("Hello, World!")`,
      javascript: `console.log("Hello, World!");`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n  cout << "Hello, World!" << endl;\n  return 0;\n}`,
      java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}`
    }
  },
  {
    id: 'tpl-input-output',
    titleKey: 'templates.items.io.title',
    descriptionKey: 'templates.items.io.desc',
    category: 'basics',
    supportedLanguages: ['python', 'javascript'],
    sourceCode: {
      python: `name = input("Enter your name: ")\nprint("Hello, " + name)`,
      javascript: `const name = prompt("Enter your name:");\nconsole.log("Hello, " + name);`
    }
  },
  {
    id: 'tpl-sum',
    titleKey: 'templates.items.sum.title',
    descriptionKey: 'templates.items.sum.desc',
    category: 'basics',
    supportedLanguages: ['python', 'javascript', 'cpp', 'java'],
    sourceCode: {
      python: `a = 5\nb = 10\nsum = a + b\nprint("Sum:", sum)`,
      javascript: `let a = 5;\nlet b = 10;\nlet sum = a + b;\nconsole.log("Sum:", sum);`,
      cpp: `int a = 5;\nint b = 10;\nint sum = a + b;\ncout << "Sum:" << sum << endl;`,
      java: `int a = 5;\nint b = 10;\nint sum = a + b;\nSystem.out.println("Sum:" + sum);`
    }
  },
  // Condicionales
  {
    id: 'tpl-if-simple',
    titleKey: 'templates.items.ifSimple.title',
    descriptionKey: 'templates.items.ifSimple.desc',
    category: 'conditionals',
    supportedLanguages: ['python', 'javascript', 'cpp', 'java'],
    sourceCode: {
      python: `age = 18\nif age >= 18:\n  print("Adult")`,
      javascript: `let age = 18;\nif (age >= 18) {\n  console.log("Adult");\n}`,
      cpp: `int age = 18;\nif (age >= 18) {\n  cout << "Adult" << endl;\n}`,
      java: `int age = 18;\nif (age >= 18) {\n  System.out.println("Adult");\n}`
    }
  },
  {
    id: 'tpl-if-else',
    titleKey: 'templates.items.ifElse.title',
    descriptionKey: 'templates.items.ifElse.desc',
    category: 'conditionals',
    supportedLanguages: ['python', 'javascript', 'cpp', 'java'],
    sourceCode: {
      python: `score = 85\nif score >= 60:\n  print("Pass")\nelse:\n  print("Fail")`,
      javascript: `let score = 85;\nif (score >= 60) {\n  console.log("Pass");\n} else {\n  console.log("Fail");\n}`,
      cpp: `int score = 85;\nif (score >= 60) {\n  cout << "Pass" << endl;\n} else {\n  cout << "Fail" << endl;\n}`,
      java: `int score = 85;\nif (score >= 60) {\n  System.out.println("Pass");\n} else {\n  System.out.println("Fail");\n}`
    }
  },
  {
    id: 'tpl-max-three',
    titleKey: 'templates.items.maxThree.title',
    descriptionKey: 'templates.items.maxThree.desc',
    category: 'conditionals',
    supportedLanguages: ['python', 'javascript'],
    sourceCode: {
      python: `a = 10\nb = 25\nc = 15\nif a > b and a > c:\n  print("Max is", a)\nelif b > c:\n  print("Max is", b)\nelse:\n  print("Max is", c)`,
      javascript: `let a = 10;\nlet b = 25;\nlet c = 15;\nif (a > b && a > c) {\n  console.log("Max is", a);\n} else if (b > c) {\n  console.log("Max is", b);\n} else {\n  console.log("Max is", c);\n}`
    }
  },
  // Bucles
  {
    id: 'tpl-for-loop',
    titleKey: 'templates.items.forLoop.title',
    descriptionKey: 'templates.items.forLoop.desc',
    category: 'loops',
    supportedLanguages: ['python', 'javascript', 'cpp', 'java'],
    sourceCode: {
      python: `for i in range(5):\n  print("Iteration", i)`,
      javascript: `for (let i = 0; i < 5; i++) {\n  console.log("Iteration", i);\n}`,
      cpp: `for (int i = 0; i < 5; i++) {\n  cout << "Iteration " << i << endl;\n}`,
      java: `for (int i = 0; i < 5; i++) {\n  System.out.println("Iteration " + i);\n}`
    }
  },
  {
    id: 'tpl-while-loop',
    titleKey: 'templates.items.whileLoop.title',
    descriptionKey: 'templates.items.whileLoop.desc',
    category: 'loops',
    supportedLanguages: ['python', 'javascript', 'cpp', 'java'],
    sourceCode: {
      python: `count = 0\nwhile count < 3:\n  print("Count is", count)\n  count = count + 1`,
      javascript: `let count = 0;\nwhile (count < 3) {\n  console.log("Count is", count);\n  count = count + 1;\n}`,
      cpp: `int count = 0;\nwhile (count < 3) {\n  cout << "Count is " << count << endl;\n  count = count + 1;\n}`,
      java: `int count = 0;\nwhile (count < 3) {\n  System.out.println("Count is " + count);\n  count = count + 1;\n}`
    }
  },
  // Algoritmos
  {
    id: 'tpl-average',
    titleKey: 'templates.items.average.title',
    descriptionKey: 'templates.items.average.desc',
    category: 'algorithms',
    supportedLanguages: ['python', 'javascript'],
    sourceCode: {
      python: `numbers = [10, 20, 30, 40]\nsum_val = 0\nfor n in numbers:\n  sum_val = sum_val + n\navg = sum_val / 4\nprint("Average:", avg)`,
      javascript: `const numbers = [10, 20, 30, 40];\nlet sum_val = 0;\nfor (let i = 0; i < numbers.length; i++) {\n  sum_val = sum_val + numbers[i];\n}\nlet avg = sum_val / 4;\nconsole.log("Average:", avg);`
    }
  },
  {
    id: 'tpl-search',
    titleKey: 'templates.items.search.title',
    descriptionKey: 'templates.items.search.desc',
    category: 'algorithms',
    supportedLanguages: ['python', 'javascript'],
    sourceCode: {
      python: `arr = [5, 2, 9, 1, 5, 6]\ntarget = 9\nfound = False\nfor item in arr:\n  if item == target:\n    found = True\nif found:\n  print("Found target")\nelse:\n  print("Not found")`,
      javascript: `let arr = [5, 2, 9, 1, 5, 6];\nlet target = 9;\nlet found = false;\nfor (let i = 0; i < arr.length; i++) {\n  if (arr[i] === target) {\n    found = true;\n  }\n}\nif (found) {\n  console.log("Found target");\n} else {\n  console.log("Not found");\n}`
    }
  },
  {
    id: 'tpl-sort',
    titleKey: 'templates.items.sort.title',
    descriptionKey: 'templates.items.sort.desc',
    category: 'algorithms',
    supportedLanguages: ['python', 'javascript'],
    sourceCode: {
      python: `arr = [64, 34, 25, 12, 22, 11, 9]\nn = 7\nfor i in range(n):\n  for j in range(0, n-i-1):\n    if arr[j] > arr[j+1]:\n      temp = arr[j]\n      arr[j] = arr[j+1]\n      arr[j+1] = temp\nprint("Sorted:", arr)`,
      javascript: `let arr = [64, 34, 25, 12, 22, 11, 9];\nlet n = 7;\nfor (let i = 0; i < n; i++) {\n  for (let j = 0; j < n-i-1; j++) {\n    if (arr[j] > arr[j+1]) {\n      let temp = arr[j];\n      arr[j] = arr[j+1];\n      arr[j+1] = temp;\n    }\n  }\n}\nconsole.log("Sorted:", arr);`
    }
  },
  // Prácticas
  {
    id: 'tpl-calculator',
    titleKey: 'templates.items.calculator.title',
    descriptionKey: 'templates.items.calculator.desc',
    category: 'practical',
    supportedLanguages: ['python', 'javascript'],
    sourceCode: {
      python: `print("1: Add, 2: Sub")\nchoice = 1\nif choice == 1:\n  print("Adding")\nelif choice == 2:\n  print("Subtracting")\nelse:\n  print("Invalid")`,
      javascript: `console.log("1: Add, 2: Sub");\nlet choice = 1;\nif (choice === 1) {\n  console.log("Adding");\n} else if (choice === 2) {\n  console.log("Subtracting");\n} else {\n  console.log("Invalid");\n}`
    }
  }
];

export const getTemplatesByCategory = (category: TemplateCategory | 'all'): FlowTemplate[] => {
  if (category === 'all') return templatesRegistry;
  return templatesRegistry.filter(tpl => tpl.category === category);
};
