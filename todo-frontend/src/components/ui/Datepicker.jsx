// components/DatePickerField.jsx

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { format } from "date-fns"

export function DatePickerField({ label, value, onChange }) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between w-full text-left">
            {value ? format(value, "PPP") : "Select date"}
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date)
              setOpen(false)
            }}
            captionLayout="dropdown"
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
