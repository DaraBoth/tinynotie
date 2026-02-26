'use client';

import { Plus, Edit, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, calculateMemberBalance } from '@/utils/helpers';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';

export function TableComponent({ title, type, data, viewMode, onAdd, onEdit, onDelete, members, trips }) {
  const { isMobile } = useWindowDimensions();
  const isMembersTable = type === 'members';

  const getMemberName = (memId) =>
    members?.find((m) => m.id === memId)?.mem_name || 'Unknown';

  const getMemberSpent = (memberId) =>
    trips
      ?.filter((t) => t.mem_id === memberId)
      .reduce((sum, t) => sum + (parseFloat(t.spend) || 0), 0) || 0;

  // Table view
  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {isMembersTable ? (
              <>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Paid</th>
                <th className="text-left p-3 font-medium">Spent</th>
                <th className="text-left p-3 font-medium">Balance</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </>
            ) : (
              <>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Description</th>
                <th className="text-left p-3 font-medium">Member</th>
                <th className="text-left p-3 font-medium">Amount</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center p-8 text-muted-foreground">
                No {title.toLowerCase()} yet. Click "Add {isMembersTable ? 'Member' : 'Trip'}" to get started.
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className="border-b hover:bg-muted/50">
                {isMembersTable ? (
                  <>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{item.mem_name}</span>
                      </div>
                    </td>
                    <td className="p-3">{formatCurrency(item.paid || 0)}</td>
                    <td className="p-3">{formatCurrency(getMemberSpent(item.id))}</td>
                    <td className="p-3">
                      <Badge variant={calculateMemberBalance(item, trips) >= 0 ? 'default' : 'destructive'}>
                        {formatCurrency(Math.abs(calculateMemberBalance(item, trips)))}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {onDelete && (
                          <Button variant="ghost" size="icon" onClick={() => onDelete(item)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 font-medium">{item.trp_name}</td>
                    <td className="p-3 text-muted-foreground text-sm">{item.description || '-'}</td>
                    <td className="p-3">{getMemberName(item.mem_id)}</td>
                    <td className="p-3 font-semibold text-primary">{formatCurrency(item.spend || 0)}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // List view (mobile-friendly)
  const renderList = () => (
    <div className="space-y-3">
      {data.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground bg-muted/50 rounded-lg">
          No {title.toLowerCase()} yet. Click "Add {isMembersTable ? 'Member' : 'Trip'}" to get started.
        </div>
      ) : (
        data.map((item) => (
          <Card key={item.id} className="backdrop-blur-sm bg-card/80">
            <CardContent className="p-4">
              {isMembersTable ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{item.mem_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Paid: {formatCurrency(item.paid || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {onDelete && (
                        <Button variant="ghost" size="icon" onClick={() => onDelete(item)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                      <div className="text-xs text-muted-foreground">Spent</div>
                      <div className="font-medium">{formatCurrency(getMemberSpent(item.id))}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Balance</div>
                      <Badge variant={calculateMemberBalance(item, trips) >= 0 ? 'default' : 'destructive'}>
                        {formatCurrency(Math.abs(calculateMemberBalance(item, trips)))}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">{item.trp_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.description && <span>{item.description} • </span>}
                        {getMemberName(item.mem_id)}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="font-semibold text-primary">
                      {formatCurrency(item.spend || 0)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <Card className="backdrop-blur-sm bg-card/90 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          <Button onClick={onAdd} size={isMobile ? 'icon' : 'default'}>
            <Plus className="h-4 w-4" />
            {!isMobile && <span className="ml-2">Add {isMembersTable ? 'Member' : 'Trip'}</span>}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'table' && !isMobile ? renderTable() : renderList()}
      </CardContent>
    </Card>
  );
}
