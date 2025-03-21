import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Search, Plus, Filter, SortDesc, Notebook, Tag, Calendar } from "lucide-react";
import NotebookList from "../components/NotebookList";

export default function NotebookPage() {
  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: "var(--background-color)", color: "var(--foreground-color)" }}
    >
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Notebook className="mr-2 h-6 w-6 text-primary" />
                Notebook
              </h1>
              <p className="text-gray-500 dark:text-gray-400">Manage and organize your study notes</p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input placeholder="Search notes..." className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <SortDesc className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-full">
              <Tag className="mr-1 h-3 w-3" />
              React
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              <Tag className="mr-1 h-3 w-3" />
              JavaScript
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              <Tag className="mr-1 h-3 w-3" />
              CSS
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              <Calendar className="mr-1 h-3 w-3" />
              This Week
            </Button>
          </div>

          <NotebookList />
        </div>
      </main>
    </div>
  );
}
