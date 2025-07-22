

'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, PlusCircle, Loader2, MoreVertical, Trash2, Edit, UserX, UserCheck, Settings, ShieldCheck, Eye, ListFilter } from 'lucide-react';
import type { User, CustomSetting } from '@/types';
import { getUsers, deleteUser, updateUser, toggleUserStatus, toggleUserViewPermission } from './actions';
import { getUserRoles } from '@/app/(app)/settings/actions';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserForm } from './user-form';
import { SettingsDialog } from '@/app/(app)/settings/settings-dialog';
import { useRouter } from 'next/navigation';

export default function ManageUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<CustomSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, startTransition] = useTransition();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchData = async () => {
      setIsLoading(true);
      const [fetchedUsers, fetchedRoles] = await Promise.all([
        getUsers(),
        getUserRoles(),
      ]);
      setUsers(fetchedUsers);
      setRoles(fetchedRoles);
      setIsLoading(false);
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEditDialog = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };
  
  const closeForm = () => {
    setSelectedUser(null);
    setIsFormOpen(false);
  }

  const handleFormSubmit = (formData: FormData) => {
    if (!selectedUser) return;
    startTransition(async () => {
        const result = await updateUser(selectedUser.id, formData);
        if (result.success) {
            toast({ title: "User Updated", description: `${selectedUser.name}'s details have been updated.` });
            closeForm();
            fetchData();
        } else {
            toast({ title: "Error", description: result.error || "Failed to update user.", variant: "destructive" });
        }
    });
  };

  const handleDeleteUser = (userId: string) => {
    startTransition(async () => {
        const result = await deleteUser(userId);
        if (result.success) {
            toast({
                title: "User Deleted",
                description: "The user has been successfully deleted.",
            });
            fetchData();
        } else {
            toast({
                title: "Error",
                description: result.error || "Failed to delete user.",
                variant: "destructive",
            });
        }
    });
  };
  
  const handleToggleStatus = (user: User) => {
    startTransition(async () => {
      const result = await toggleUserStatus(user.id, user.isActive);
      if (result.success) {
        toast({ title: "Status Updated", description: `${user.name}'s status has been changed.` });
        fetchData();
      } else {
        toast({ title: "Error", description: result.error || "Failed to update status.", variant: "destructive" });
      }
    });
  };

  const handleToggleViewPermission = (user: User) => {
    startTransition(async () => {
        const result = await toggleUserViewPermission(user.id, user.viewPermission);
        if(result.success) {
            toast({ title: 'Permission Updated', description: `${user.name}'s view permission has been updated.`});
            fetchData();
        } else {
            toast({ title: 'Error', description: result.error || 'Failed to update permission.', variant: 'destructive'});
        }
    });
  }

  return (
    <>
      <PageHeader
        title="Manage Users"
        description="Add, view, and manage user accounts and their roles."
        icon={Users}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" /> Manage Roles
            </Button>
            <Button variant="outline" onClick={() => router.push('/users/roles')}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Manage Role Permissions
            </Button>
            <Button asChild>
              <Link href="/users/add">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New User
              </Link>
            </Button>
          </div>
        }
      />
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
             <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>View Permission</TableHead>
                <TableHead>Date Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'Admin' ? 'destructive' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'outline'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.viewPermission === 'ALL' ? 'default' : 'secondary'}>
                       {user.viewPermission === 'ALL' ? 'All Data' : 'Assigned Only'}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(user.createdAt), 'dd MMM, yyyy')}</TableCell>
                   <TableCell className="text-right">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                {user.isActive ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                                <span>{user.isActive ? 'Make Inactive' : 'Make Active'}</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleToggleViewPermission(user)}>
                                {user.viewPermission === 'ALL' ? <ListFilter className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                <span>{user.viewPermission === 'ALL' ? 'Set to Assigned View' : 'Set to All View'}</span>
                            </DropdownMenuItem>
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the user account for "{user.name}".
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className={buttonVariants({ variant: 'destructive' })}
                                            onClick={() => handleDeleteUser(user.id)}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? 'Deleting...' : 'Delete'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
      
      {isFormOpen && (
        <UserForm
            isEditMode
            user={selectedUser}
            roles={roles}
            isOpen={isFormOpen}
            onClose={closeForm}
            formAction={handleFormSubmit}
        />
      )}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => {
            setIsSettingsOpen(false);
            fetchData();
        }}
        settingTypes={[{ title: 'User Roles', type: 'USER_ROLE' }]}
      />
    </>
  );
}
