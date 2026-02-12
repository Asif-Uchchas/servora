"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    User,
    Settings,
    Store,
    Bell,
    Shield,
 Palette,
    Globe,
    CreditCard,
    HelpCircle,
    LogOut,
    Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    
    // Profile settings
    const [profile, setProfile] = useState({
        name: session?.user?.name || "",
        email: session?.user?.email || "",
        phone: "",
        bio: "",
    });

    // Notification settings
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        pushNotifications: true,
        orderUpdates: true,
        reservationAlerts: true,
        lowStockAlerts: true,
    });

    // Restaurant settings
    const [restaurant, setRestaurant] = useState({
        name: (session?.user as any)?.restaurantName || "",
        email: "",
        phone: "",
        address: "",
        currency: "USD",
        timezone: "America/New_York",
    });

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            // API call to update profile
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveRestaurant = async () => {
        setIsLoading(true);
        try {
            // API call to update restaurant settings
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            toast.success("Restaurant settings updated successfully!");
        } catch (error) {
            toast.error("Failed to update restaurant settings");
        } finally {
            setIsLoading(false);
        }
    };

    const userInitials = session?.user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U";

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Settings</h1>
                <Button onClick={() => signOut({ callbackUrl: "/login" })} variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Settings */}
                <motion.div variants={item} className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Profile Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                                        {userInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <Button variant="outline" size="sm">
                                        Change Avatar
                                    </Button>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        JPG, GIF or PNG. Max size of 2MB
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={profile.bio}
                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                    placeholder="Tell us about yourself..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleSaveProfile} disabled={isLoading}>
                                    <Save className="w-4 h-4 mr-2" />
                                    {isLoading ? "Saving..." : "Save Profile"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={item}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" className="w-full justify-start">
                                <Bell className="w-4 h-4 mr-2" />
                                Notification Preferences
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Palette className="w-4 h-4 mr-2" />
                                Appearance
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Globe className="w-4 h-4 mr-2" />
                                Language & Region
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <CreditCard className="w-4 h-4 mr-2" />
                                Billing & Plans
                            </Button>
                            <Separator />
                            <Button variant="outline" className="w-full justify-start">
                                <HelpCircle className="w-4 h-4 mr-2" />
                                Help & Support
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Notification Settings */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            Notification Preferences
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Email Notifications</p>
                                        <p className="text-sm text-muted-foreground">Receive email updates about your restaurant</p>
                                    </div>
                                    <Switch
                                        checked={notifications.emailNotifications}
                                        onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Push Notifications</p>
                                        <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                                    </div>
                                    <Switch
                                        checked={notifications.pushNotifications}
                                        onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Order Updates</p>
                                        <p className="text-sm text-muted-foreground">Get notified when orders change status</p>
                                    </div>
                                    <Switch
                                        checked={notifications.orderUpdates}
                                        onCheckedChange={(checked) => setNotifications({ ...notifications, orderUpdates: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Reservation Alerts</p>
                                        <p className="text-sm text-muted-foreground">New reservation requests and confirmations</p>
                                    </div>
                                    <Switch
                                        checked={notifications.reservationAlerts}
                                        onCheckedChange={(checked) => setNotifications({ ...notifications, reservationAlerts: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Low Stock Alerts</p>
                                        <p className="text-sm text-muted-foreground">Get alerts when inventory items are low</p>
                                    </div>
                                    <Switch
                                        checked={notifications.lowStockAlerts}
                                        onCheckedChange={(checked) => setNotifications({ ...notifications, lowStockAlerts: checked })}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Restaurant Settings */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="w-5 h-5" />
                            Restaurant Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="restaurantName">Restaurant Name</Label>
                                <Input
                                    id="restaurantName"
                                    value={restaurant.name}
                                    onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
                                    placeholder="Your Restaurant"
                                />
                            </div>
                            <div>
                                <Label htmlFor="restaurantEmail">Restaurant Email</Label>
                                <Input
                                    id="restaurantEmail"
                                    type="email"
                                    value={restaurant.email}
                                    onChange={(e) => setRestaurant({ ...restaurant, email: e.target.value })}
                                    placeholder="restaurant@example.com"
                                />
                            </div>
                            <div>
                                <Label htmlFor="restaurantPhone">Restaurant Phone</Label>
                                <Input
                                    id="restaurantPhone"
                                    value={restaurant.phone}
                                    onChange={(e) => setRestaurant({ ...restaurant, phone: e.target.value })}
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>
                            <div>
                                <Label htmlFor="currency">Currency</Label>
                                <select
                                    id="currency"
                                    value={restaurant.currency}
                                    onChange={(e) => setRestaurant({ ...restaurant, currency: e.target.value })}
                                    className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-background border-input"
                                >
                                    <option value="USD">USD - US Dollar</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="GBP">GBP - British Pound</option>
                                    <option value="CAD">CAD - Canadian Dollar</option>
                                    <option value="AUD">AUD - Australian Dollar</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                value={restaurant.address}
                                onChange={(e) => setRestaurant({ ...restaurant, address: e.target.value })}
                                placeholder="123 Main St, City, State 12345"
                                rows={2}
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleSaveRestaurant} disabled={isLoading}>
                                <Save className="w-4 h-4 mr-2" />
                                {isLoading ? "Saving..." : "Save Restaurant Settings"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}