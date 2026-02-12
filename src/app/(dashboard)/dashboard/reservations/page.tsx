"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Plus,
    Calendar,
    Clock,
    Users,
    Phone,
    Mail,
    MapPin,
    Check,
    X,
    AlertTriangle,
    MoreHorizontal,
    Edit,
    Trash2,
    Filter,
    RefreshCw,
    User,
    Table,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDateTime, formatTime, getStatusColor } from "@/lib/utils";
import type { ReservationStatus } from "@/types";

const RESERVATION_STATUS = ['CONFIRMED', 'PENDING', 'CANCELLED', 'COMPLETED'] as const;
const STATUS_ICONS = {
    CONFIRMED: Check,
    PENDING: Clock,
    CANCELLED: X,
    COMPLETED: Users,
};

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

interface Reservation {
    id: string;
    customerName: string;
    phone: string | null;
    email: string | null;
    guests: number;
    reservationTime: string;
    tableNumber: string | null;
    status: ReservationStatus;
    notes: string | null;
    createdAt: string;
}

interface NewReservation {
    customerName: string;
    phone: string;
    email: string;
    guests: number;
    reservationTime: string;
    tableNumber: string;
    notes: string;
}

export default function ReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newReservation, setNewReservation] = useState<NewReservation>({
        customerName: "",
        phone: "",
        email: "",
        guests: 2,
        reservationTime: "",
        tableNumber: "",
        notes: "",
    });

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            const response = await fetch("/api/reservations");
            const data = await response.json();
            setReservations(data);
        } catch (error) {
            console.error("Failed to fetch reservations:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateReservationStatus = async (reservationId: string, status: ReservationStatus) => {
        try {
            const response = await fetch(`/api/reservations/${reservationId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            
            if (response.ok) {
                await fetchReservations();
            }
        } catch (error) {
            console.error("Failed to update reservation status:", error);
        }
    };

    const createReservation = async () => {
        try {
            const response = await fetch("/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newReservation),
            });
            
            if (response.ok) {
                setIsAddModalOpen(false);
                setNewReservation({
                    customerName: "",
                    phone: "",
                    email: "",
                    guests: 2,
                    reservationTime: "",
                    tableNumber: "",
                    notes: "",
                });
                await fetchReservations();
            }
        } catch (error) {
            console.error("Failed to create reservation:", error);
        }
    };

    const filteredReservations = reservations.filter(reservation => {
        const matchesSearch = 
            reservation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.phone?.includes(searchTerm.toLowerCase()) ||
            reservation.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = selectedStatus === "all" || reservation.status === selectedStatus;
        
        return matchesSearch && matchesStatus;
    });

    const reservationsByStatus = RESERVATION_STATUS.map(status => ({
        status,
        icon: STATUS_ICONS[status],
        reservations: filteredReservations.filter(reservation => reservation.status === status),
        color: getStatusColor(status),
    }));

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">Reservations</h1>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {RESERVATION_STATUS.map(status => (
                        <Card key={status} className="bg-zinc-900 border-zinc-800">
                            <CardHeader className="pb-3">
                                <Skeleton className="h-6 w-20" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <Skeleton key={i} className="h-24 w-full" />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-white">Reservations</h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Search reservations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 w-64"
                        />
                    </div>
                    <Button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Reservation
                    </Button>
                    <Button className="bg-zinc-800 hover:bg-zinc-700 text-white">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-zinc-900 border-zinc-800">
                    <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                        All ({filteredReservations.length})
                    </TabsTrigger>
                    {RESERVATION_STATUS.map(status => (
                        <TabsTrigger key={status} value={status} className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                            {status.charAt(0) + status.slice(1).toLowerCase()} 
                            ({reservationsByStatus.find(s => s.status === status)?.reservations.length || 0})
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {reservationsByStatus.map(({ status, icon: Icon, reservations, color }) => (
                    <motion.div key={status} variants={item}>
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Icon className={`h-5 w-5 ${color}`} />
                                    {status.charAt(0) + status.slice(1).toLowerCase()}
                                    <Badge variant="secondary" className="ml-auto">
                                        {reservations.length}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    <AnimatePresence>
                                        {reservations.map(reservation => (
                                            <motion.div
                                                key={reservation.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                className="bg-zinc-800 rounded-lg p-4 cursor-pointer hover:bg-zinc-700 transition-colors"
                                                onClick={() => setSelectedReservation(reservation)}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <div className="font-semibold text-white">{reservation.customerName}</div>
                                                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                                                            <Users className="h-3 w-3" />
                                                            {reservation.guests} guests
                                                        </div>
                                                        {reservation.tableNumber && (
                                                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                                                                <Table className="h-3 w-3" />
                                                                Table {reservation.tableNumber}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                                                            <DropdownMenuItem onClick={() => setSelectedReservation(reservation)} className="text-white">
                                                                <Users className="h-4 w-4 mr-2" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-zinc-700" />
                                                            {status === 'PENDING' && (
                                                                <DropdownMenuItem onClick={() => updateReservationStatus(reservation.id, 'CONFIRMED')} className="text-white">
                                                                    <Check className="h-4 w-4 mr-2" />
                                                                    Confirm
                                                                </DropdownMenuItem>
                                                            )}
                                                            {status === 'CONFIRMED' && (
                                                                <DropdownMenuItem onClick={() => updateReservationStatus(reservation.id, 'COMPLETED')} className="text-white">
                                                                    <Users className="h-4 w-4 mr-2" />
                                                                    Mark Completed
                                                                </DropdownMenuItem>
                                                            )}
                                                            {status !== 'CANCELLED' && status !== 'COMPLETED' && (
                                                                <DropdownMenuItem onClick={() => updateReservationStatus(reservation.id, 'CANCELLED')} className="text-red-400">
                                                                    <X className="h-4 w-4 mr-2" />
                                                                    Cancel
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-xs text-zinc-500">
                                                        {formatDateTime(reservation.reservationTime)}
                                                    </div>
                                                    <div className="text-xs text-zinc-500">
                                                        {formatTime(reservation.reservationTime)}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            Reservation Details
                            <Badge className={getStatusColor(selectedReservation?.status || 'PENDING')}>
                                {selectedReservation?.status}
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>
                    {selectedReservation && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-zinc-400">Customer Name</Label>
                                    <p className="text-white">{selectedReservation.customerName}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-zinc-400">Phone</Label>
                                    <p className="text-white">{selectedReservation.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-zinc-400">Email</Label>
                                    <p className="text-white">{selectedReservation.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-zinc-400">Guests</Label>
                                    <p className="text-white">{selectedReservation.guests}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-zinc-400">Table</Label>
                                    <p className="text-white">{selectedReservation.tableNumber || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-zinc-400">Reservation Time</Label>
                                    <p className="text-white">{formatDateTime(selectedReservation.reservationTime)}</p>
                                </div>
                            </div>
                            
                            {selectedReservation.notes && (
                                <div>
                                    <Label className="text-sm font-medium text-zinc-400">Notes</Label>
                                    <p className="text-white bg-zinc-800 p-3 rounded-lg">{selectedReservation.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add New Reservation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="customerName">Customer Name</Label>
                            <Input
                                id="customerName"
                                value={newReservation.customerName}
                                onChange={(e) => setNewReservation({...newReservation, customerName: e.target.value})}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={newReservation.phone}
                                    onChange={(e) => setNewReservation({...newReservation, phone: e.target.value})}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={newReservation.email}
                                    onChange={(e) => setNewReservation({...newReservation, email: e.target.value})}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="guests">Guests</Label>
                                <Input
                                    id="guests"
                                    type="number"
                                    min="1"
                                    value={newReservation.guests}
                                    onChange={(e) => setNewReservation({...newReservation, guests: parseInt(e.target.value)})}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>
                            <div>
                                <Label htmlFor="tableNumber">Table Number</Label>
                                <Input
                                    id="tableNumber"
                                    value={newReservation.tableNumber}
                                    onChange={(e) => setNewReservation({...newReservation, tableNumber: e.target.value})}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="reservationTime">Reservation Time</Label>
                            <Input
                                id="reservationTime"
                                type="datetime-local"
                                value={newReservation.reservationTime}
                                onChange={(e) => setNewReservation({...newReservation, reservationTime: e.target.value})}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <div>
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={newReservation.notes}
                                onChange={(e) => setNewReservation({...newReservation, notes: e.target.value})}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsAddModalOpen(false)}
                            className="border-zinc-700 text-white hover:bg-zinc-800"
                        >
                            Cancel
                        </Button>
                        <Button onClick={createReservation} className="bg-blue-600 hover:bg-blue-700">
                            Create Reservation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}