"use client"

import { Avatar, AvatarFallback } from "../components/ui/Avatar"
import { Brain } from "lucide-react"

export default function AIChat() {
  const messages = [
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm your AI study assistant. How can I help you with your learning today?",
    },
    {
      id: 2,
      role: "user",
      content: "Can you explain React hooks to me?",
    },
    {
      id: 3,
      role: "assistant",
      content: `React Hooks are functions that let you "hook into" React state and lifecycle features from function components. They were introduced in React 16.8.

Here are the most commonly used hooks:

1. **useState**: Lets you add state to functional components
\`\`\`jsx
const [count, setCount] = useState(0);
\`\`\`

2. **useEffect**: Performs side effects in function components
\`\`\`jsx
useEffect(() => {
  document.title = \`You clicked \${count} times\`;
}, [count]); // Only re-run if count changes
\`\`\`

3. **useContext**: Accepts a context object and returns the current context value
\`\`\`jsx
const value = useContext(MyContext);
\`\`\`

4. **useRef**: Returns a mutable ref object
\`\`\`jsx
const inputRef = useRef(null);
\`\`\`

5. **useCallback**: Returns a memoized callback function
\`\`\`jsx
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
\`\`\`

Would you like me to explain any of these hooks in more detail?`,
    },
    {
      id: 4,
      role: "user",
      content: "Can you explain useEffect in more detail?",
    },
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
            {message.role === "assistant" ? (
              <Avatar className="h-8 w-8 bg-primary/10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Brain className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-8 w-8">
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
            )}
            <div
              className={`p-4 rounded-lg ${
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

