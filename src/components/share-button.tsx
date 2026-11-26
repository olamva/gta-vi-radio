import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { Check, Copy, Download, Link, Share, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FacebookIcon, WhatsAppIcon, XIcon } from "@/components/brand-icons";
import type { Ranking } from "@/match.ts";
import { canShare, isTouch, renderCard, shareData } from "@/share.ts";
import type { Profiles } from "@/spotify.ts";

interface ShareButtonProps {
  rankings: Ranking[];
  profiles: Profiles;
}

interface ActionProps {
  icon: ReactNode;
  children: ReactNode;
  href?: string;
  download?: string;
  onClick?: () => void;
}

const Action = ({ icon, children, href, download, onClick }: ActionProps) => {
  const className = "h-11 justify-start rounded-sm px-4";
  return href ? (
    <Button asChild variant="secondary" className={className}>
      <a
        href={href}
        download={download}
        target={download ? undefined : "_blank"}
        rel="noreferrer"
      >
        {icon}
        {children}
      </a>
    </Button>
  ) : (
    <Button variant="secondary" className={className} onClick={onClick}>
      {icon}
      {children}
    </Button>
  );
};

export const ShareButton = ({ rankings, profiles }: ShareButtonProps) => {
  const [card, setCard] = useState<File>();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string>();
  const preview = useMemo(() => card && URL.createObjectURL(card), [card]);
  useEffect(() => {
    renderCard(
      rankings.filter(({ hits }) => hits.length),
      profiles,
    ).then(setCard);
  }, [rankings, profiles]);

  const data = card && shareData(card, rankings[0].station.name);
  const text = encodeURIComponent(data?.text ?? "");
  const url = encodeURIComponent(location.origin);
  const message = encodeURIComponent(`${data?.text} ${location.origin}`);
  const share = () =>
    data &&
    (isTouch() && canShare(data)
      ? navigator.share(data).catch(() => undefined)
      : setOpen(true));
  const copy = async (label: string, write: () => Promise<void>) => {
    await write();
    setCopied(label);
    setTimeout(() => setCopied(undefined), 2000);
  };
  const copyIcon = (label: string, icon: ReactNode) =>
    copied === label ? <Check /> : icon;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Button variant="outline" disabled={!card} onClick={share}>
        <Share2 />
        Share my results
      </Button>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 gap-8 overflow-y-auto bg-card p-6 pt-16 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:grid-cols-[minmax(0,1fr)_15rem] sm:p-8">
          <img
            src={preview}
            alt="Your GTA VI Radio Match card"
            className="w-full"
          />
          <div className="flex flex-col">
            <Dialog.Title className="pr-8 font-display text-3xl leading-none font-black uppercase">
              Share my results
            </Dialog.Title>
            <Dialog.Description className="mt-3 text-sm text-muted-foreground">
              Copy or download the card. Then post it with the link.
            </Dialog.Description>
            {card && preview && (
              <div className="mt-6 grid gap-2">
                <Action
                  icon={copyIcon("image", <Copy />)}
                  onClick={() =>
                    copy("image", () =>
                      navigator.clipboard.write([
                        new ClipboardItem({ [card.type]: card }),
                      ]),
                    )
                  }
                >
                  {copied === "image" ? "Copied" : "Copy image"}
                </Action>
                <Action icon={<Download />} href={preview} download={card.name}>
                  Download image
                </Action>
                <Action
                  icon={copyIcon("link", <Link />)}
                  onClick={() =>
                    copy("link", () =>
                      navigator.clipboard.writeText(location.origin),
                    )
                  }
                >
                  {copied === "link" ? "Copied" : "Copy link"}
                </Action>
                <Action
                  icon={<XIcon />}
                  href={`https://x.com/intent/post?text=${text}&url=${url}`}
                >
                  Post on X
                </Action>
                <Action
                  icon={<WhatsAppIcon />}
                  href={`https://wa.me/?text=${message}`}
                >
                  WhatsApp
                </Action>
                <Action
                  icon={<FacebookIcon />}
                  href={`https://www.facebook.com/sharer/sharer.php?u=${url}`}
                >
                  Facebook
                </Action>
                {data && canShare(data) && (
                  <Action
                    icon={<Share />}
                    onClick={() => navigator.share(data).catch(() => undefined)}
                  >
                    More options
                  </Action>
                )}
              </div>
            )}
          </div>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              className="absolute top-4 right-4 text-muted-foreground"
            >
              <X />
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
