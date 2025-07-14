"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog"

interface DeleteEventDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onConfirmDelete: () => void
  eventTitle?: string
}

export default function DeleteEventDialog({
  isOpen,
  onOpenChange,
  onConfirmDelete,
  eventTitle,
}: DeleteEventDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#0a0a0a] border-white/10 text-gray-100 backdrop-blur-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            This action cannot be undone. This will permanently delete the event &quot;{eventTitle || "this event"}&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-white/10 text-gray-300 hover:bg-white/[0.08]">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmDelete} className="bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
