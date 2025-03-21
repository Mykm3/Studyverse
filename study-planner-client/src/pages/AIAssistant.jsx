import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Brain, Send } from "lucide-react";
import AIChat from "../components/AiChat";

export default function AIAssistantPage() {
  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: "var(--background-color)", color: "var(--foreground-color)" }}
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Brain className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-2xl font-bold">AI Study Assistant</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          Ask questions, get explanations, or generate study materials
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <AIChat />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input placeholder="Ask anything about your studies..." className="flex-1" />
          <Button>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 flex justify-center gap-2">
          <Button variant="outline" size="sm">
            Explain React hooks
          </Button>
          <Button variant="outline" size="sm">
            Generate quiz
          </Button>
          <Button variant="outline" size="sm">
            Summarize my notes
          </Button>
        </div>
      </div>
    </div>
  );
}
