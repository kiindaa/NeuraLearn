import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User, Mail, Calendar, Camera } from 'lucide-react';
import { formatDate } from '../../utils';
import { KpiTile } from '../../components/ui/KpiTile';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile not found</h2>
        <p className="text-gray-600">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-50 via-purple-50 to-emerald-50 p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{`Welcome Back, ${user.firstName}!`}</h1>
            <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar block */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xl">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" /> Change Photo
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={user.firstName}
                  leftIcon={<User className="h-5 w-5" />}
                  readOnly
                />
                <Input
                  label="Last Name"
                  value={user.lastName}
                  leftIcon={<User className="h-5 w-5" />}
                  readOnly
                />
              </div>

              <Input
                label="Email"
                value={user.email}
                leftIcon={<Mail className="h-5 w-5" />}
                readOnly
              />

              <div className="flex space-x-3">
                <Button variant="primary">Update Profile</Button>
                <Button variant="outline">Change Password</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Summary */}
        <div>
          <div className="grid grid-cols-1 gap-4">
            <KpiTile label="Role" value={user.role} variant="blue" icon={<User className="h-6 w-6" />} />
            <KpiTile label="Member since" value={formatDate(user.createdAt)} variant="emerald" icon={<Calendar className="h-6 w-6" />} />
            <KpiTile label="Email verified" value={'Yes'} variant="purple" icon={<Mail className="h-6 w-6" />} />
          </div>
        </div>
      </div>
    </div>
  );
};
