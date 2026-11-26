import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileAvatarProps {
  name: string;
  image?: string;
  className?: string;
}

export const ProfileAvatar = ({
  name,
  image,
  className,
}: ProfileAvatarProps) => (
  <Avatar className={className}>
    <AvatarImage src={image} alt={name} />
    <AvatarFallback className="font-semibold">
      {name.slice(0, 1)}
    </AvatarFallback>
  </Avatar>
);
