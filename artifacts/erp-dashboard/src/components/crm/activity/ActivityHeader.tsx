import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageSquare, ListTodo, Mail, Smartphone, Calendar as CalendarIcon, Filter, ChevronDown } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { WhatsappIcon } from "./utils";

interface ActivityHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  timelineFilter: "all" | "pending" | "completed";
  setTimelineFilter: (filter: "all" | "pending" | "completed") => void;
}

export function ActivityHeader({
  setActiveTab,
  timelineFilter,
  setTimelineFilter,
}: ActivityHeaderProps) {
  return (
    <div className="border-b px-2 py-2 flex items-center justify-between bg-muted/30">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
        <TabsTrigger
          value="activity"
          className="text-xs px-2 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white h-8"
          data-testid="tab-activity"
        >
          <Plus className="h-3 w-3 mr-1" />
          Ish
        </TabsTrigger>
        <TabsTrigger
          value="comment"
          className="text-xs px-2 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white h-8"
          data-testid="tab-comment"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Sharh
        </TabsTrigger>
        <TabsTrigger
          value="task"
          className="text-xs px-2 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white h-8"
          data-testid="tab-task"
        >
          <ListTodo className="h-3 w-3 mr-1" />
          Vazifa
        </TabsTrigger>
        <TabsTrigger
          value="whatsapp"
          className="text-xs px-2 py-1.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white h-8"
          data-testid="tab-whatsapp"
        >
          <WhatsappIcon className="h-3 w-3 mr-1" />
          WhatsApp
        </TabsTrigger>
        <TabsTrigger
          value="sms"
          className="text-xs px-2 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white h-8"
          data-testid="tab-sms"
        >
          <Smartphone className="h-3 w-3 mr-1" />
          SMS
        </TabsTrigger>
        <TabsTrigger
          value="email"
          className="text-xs px-2 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white h-8"
          data-testid="tab-email"
        >
          <Mail className="h-3 w-3 mr-1" />
          Xat
        </TabsTrigger>
        <TabsTrigger
          value="slots"
          className="text-xs px-2 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white h-8"
          data-testid="tab-slots"
        >
          <CalendarIcon className="h-3 w-3 mr-1" />
          Slotlar
        </TabsTrigger>
      </TabsList>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 font-normal text-muted-foreground hover:text-foreground">
            <Filter className="h-3.5 w-3.5" />
            {timelineFilter === "all" ? "Barchasi" : timelineFilter === "pending" ? "Kutilayotgan" : "Bajarilgan"}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem 
            className="text-xs" 
            onClick={() => setTimelineFilter("all")}
          >
            Barcha faoliyatlar
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-xs" 
            onClick={() => setTimelineFilter("pending")}
          >
            Kutilayotganlar
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-xs" 
            onClick={() => setTimelineFilter("completed")}
          >
            Bajarilganlar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
