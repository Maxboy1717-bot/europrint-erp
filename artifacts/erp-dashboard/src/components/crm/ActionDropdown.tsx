import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  User,
  Users,
  MapPin,
  Building2,
  Link,
  Paperclip,
  MoreHorizontal,
} from "lucide-react";

interface ActionDropdownProps {
  onAddToCalendar?: () => void;
  onSelectClient?: () => void;
  onInviteColleagues?: () => void;
  onSetAddress?: () => void;
  onSelectMeetingRoom?: () => void;
  onAttachLink?: () => void;
  onAttachFile?: () => void;
  trigger?: React.ReactNode;
}

export function ActionDropdown({
  onAddToCalendar,
  onSelectClient,
  onInviteColleagues,
  onSetAddress,
  onSelectMeetingRoom,
  onAttachLink,
  onAttachFile,
  trigger,
}: ActionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button
            size="icon"
            variant="ghost"
            data-testid="button-action-dropdown"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" data-testid="action-dropdown-menu">
        <DropdownMenuItem
          onClick={onAddToCalendar}
          data-testid="action-add-to-calendar"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Добавить в календарь
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onSelectClient}
          data-testid="action-select-client"
        >
          <User className="h-4 w-4 mr-2" />
          Выбрать клиента
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onInviteColleagues}
          data-testid="action-invite-colleagues"
        >
          <Users className="h-4 w-4 mr-2" />
          Пригласить коллег
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onSetAddress}
          data-testid="action-set-address"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Указать адрес
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onSelectMeetingRoom}
          data-testid="action-select-meeting-room"
        >
          <Building2 className="h-4 w-4 mr-2" />
          Выбрать переговорную
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onAttachLink}
          data-testid="action-attach-link"
        >
          <Link className="h-4 w-4 mr-2" />
          Прикрепить ссылку
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onAttachFile}
          data-testid="action-attach-file"
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Прикрепить файл
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
