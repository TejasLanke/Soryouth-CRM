
'use client';

import { useState, useEffect, useTransition } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, Loader2 } from 'lucide-react';
import type { CustomSetting, RolePermission } from '@/types';
import { getUserRoles } from '@/app/(app)/settings/actions';
import { getUserPermissions, updateRolePermissions } from '../actions';
import { NAV_ITEMS, TOOLS_NAV_ITEMS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

function RolePermissionsDialog({ role, isOpen, onOpenChange, onPermissionsUpdate }: { role: CustomSetting, isOpen: boolean, onOpenChange: (open: boolean) => void, onPermissionsUpdate: () => void }) {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, startSaveTransition] = useTransition();
  const { toast } = useToast();

  const allNavItems = [...NAV_ITEMS, ...TOOLS_NAV_ITEMS].filter(item => item.href !== '/dashboard');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getUserPermissions(role.name).then(perms => {
        setPermissions(perms);
        setIsLoading(false);
      });
    }
  }, [isOpen, role]);

  const handlePermissionChange = (navPath: string, checked: boolean) => {
    if (checked) {
      setPermissions(prev => [...prev, { id: '', roleName: role.name, navPath }]);
    } else {
      setPermissions(prev => prev.filter(p => p.navPath !== navPath));
    }
  };

  const handleSave = () => {
    startSaveTransition(async () => {
      const permissionsToSave = allNavItems.map(item => ({
        navPath: item.href,
        allowed: permissions.some(p => p.navPath === item.href),
      }));
      
      const result = await updateRolePermissions(role.name, permissionsToSave);
      
      if (result.success) {
        toast({ title: 'Permissions Updated', description: `Permissions for the ${role.name} role have been saved.` });
        onPermissionsUpdate();
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to save permissions.', variant: 'destructive' });
      }
    });
  };

  const hasPermission = (navPath: string) => permissions.some(p => p.navPath === navPath);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Permissions for: {role.name}</DialogTitle>
          <DialogDescription>Select the pages this role can access.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="py-4 max-h-[60vh] overflow-y-auto space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Main Navigation</h4>
              <div className="space-y-2">
                {NAV_ITEMS.filter(item => item.href !== '/dashboard').map(item => (
                  <div key={item.href} className="flex items-center space-x-2">
                    <Checkbox id={`${role.id}-${item.href}`} checked={hasPermission(item.href)} onCheckedChange={(checked) => handlePermissionChange(item.href, !!checked)} />
                    <Label htmlFor={`${role.id}-${item.href}`} className="font-normal">{item.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Tools & Other Sections</h4>
              <div className="space-y-2">
                 {TOOLS_NAV_ITEMS.map(item => (
                  <div key={item.href} className="flex items-center space-x-2">
                    <Checkbox id={`${role.id}-${item.href}`} checked={hasPermission(item.href)} onCheckedChange={(checked) => handlePermissionChange(item.href, !!checked)} />
                    <Label htmlFor={`${role.id}-${item.href}`} className="font-normal">{item.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function ManageRolePermissionsPage() {
  const [roles, setRoles] = useState<CustomSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<CustomSetting | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchRoles = async () => {
    setIsLoading(true);
    const fetchedRoles = await getUserRoles();
    setRoles(fetchedRoles);
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchRoles();
  }, []);

  const handleEditPermissions = (role: CustomSetting) => {
    setSelectedRole(role);
    setIsDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Role Permissions"
        description="Define which pages each user role can access. Admins have access to all pages by default."
        icon={ShieldCheck}
      />
      {isLoading ? (
        <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map(role => (
            <Card key={role.id}>
              <CardHeader>
                <CardTitle>{role.name}</CardTitle>
                <CardDescription>
                  {role.name === 'Admin' ? "Has access to all pages." : "Click below to manage permissions."}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => handleEditPermissions(role)} disabled={role.name === 'Admin'}>
                  Edit Permissions
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {selectedRole && (
        <RolePermissionsDialog
          role={selectedRole}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onPermissionsUpdate={fetchRoles} // You might not need to refetch roles, but it's safe.
        />
      )}
    </>
  );
}
