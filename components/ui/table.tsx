'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

function removeEmptyTextNodes(children: React.ReactNode) {
  return React.Children.toArray(children).filter(
    (child) => typeof child !== 'string' || child.trim().length > 0,
  )
}

function normalizeCellChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'number' && Number.isNaN(children)) {
    return '0'
  }

  if (Array.isArray(children)) {
    return children.map((child) => normalizeCellChildren(child))
  }

  return children
}

function Table({ className, children, ...props }: React.ComponentPropsWithoutRef<'table'>) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      >
        {removeEmptyTextNodes(children)}
      </table>
    </div>
  )
}

function TableHeader({ className, children, ...props }: React.ComponentPropsWithoutRef<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('[&_tr]:border-b', className)}
      {...props}
    >
      {removeEmptyTextNodes(children)}
    </thead>
  )
}

function TableBody({ className, children, ...props }: React.ComponentPropsWithoutRef<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    >
      {removeEmptyTextNodes(children)}
    </tbody>
  )
}

function TableFooter({ className, children, ...props }: React.ComponentPropsWithoutRef<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    >
      {removeEmptyTextNodes(children)}
    </tfoot>
  )
}

function TableRow({ className, children, ...props }: React.ComponentPropsWithoutRef<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
        className,
      )}
      {...props}
    >
      {removeEmptyTextNodes(children)}
    </tr>
  )
}

function TableHead({ className, ...props }: React.ComponentPropsWithoutRef<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, children, ...props }: React.ComponentPropsWithoutRef<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    >
      {normalizeCellChildren(children)}
    </td>
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
