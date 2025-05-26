import React, { useState } from 'react'
import { BarChart2, Settings, Bell, TrendingUp, Users, Menu, FileText, Folders ,PenLine } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const SIDEBAR_ITEMS = [
    {name: "Overview", icon: BarChart2, color: "#6366f1", href: "/overview"},
    {name: "Content", icon: Folders, color: "#8B5Cf3", href: "/content"},
    {name: "Posts", icon: PenLine, color: "#38B2F3", href: "/posts"},
    {name: "Users", icon: Users, color: "#EC4899", href: "/users"},
    {name: "Reports", icon: FileText, color: "#10B981", href: "/reports"},
    {name: "Notifications", icon: Bell, color: "#F59E08", href: "/notifications"},
    {name: "Settings", icon: Settings, color: "#6EE7B7", href: "/settings"}
]

const Sidebar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const location = useLocation()

    return (
        <div className='h-full bg-gray-800 bg-opacity-50 backdrop-blur-md p-4 flex flex-col border-r border-gray-700'>
            <div className='flex items-center justify-between gap-4 mb-8'>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className='text-white text-xl font-bold'
                    >
                        TalentLoop
                    </motion.div>
                )}
                
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className='p-2 rounded-full hover:bg-gray-700 transition-colors'
                >
                    <Menu size={24} />
                </motion.button>
            </div>
            
            {/* Sidebar Items */}
            <nav className='flex-grow'>
                {SIDEBAR_ITEMS.map((item) => {
                    const isActive = location.pathname === item.href
                    
                    return (
                        <Link key={item.href} to={item.href}>
                            <motion.div 
                                className={`flex items-center p-4 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors mb-2 relative ${
                                    isActive ? 'bg-gray-600' : ''
                                }`}
                                whileHover={{ scale: 1.05 }}
                            >
                                {isActive && (
                                    <motion.div
                                        className="absolute left-0 w-1 h-full bg-current rounded-r-full"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ color: item.color }}
                                    />
                                )}
                                
                                <item.icon 
                                    size={20} 
                                    style={{ 
                                        color: isActive ? item.color : '#9CA3AF',
                                        minWidth: "20px" 
                                    }} 
                                />

                                <AnimatePresence>
                                    {isSidebarOpen && (
                                        <motion.span
                                            className='ml-4 whitespace-nowrap'
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{ duration: 0.2, delay: 0.3 }}
                                            style={{ color: isActive ? item.color : 'inherit' }}
                                        >
                                            {item.name}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}

export default Sidebar