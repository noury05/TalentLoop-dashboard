import React, { useState } from 'react'
import { Bell, UserCircle, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

const Header = ({ title }) => {
const [searchQuery, setSearchQuery] = useState('')

const handleSearch = (e) => {
    e.preventDefault()
    // Add your search logic here
    console.log('Searching for:', searchQuery)
}

return (
    <header className='bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg border-b border-gray-700'>
        <div className='max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center'>
            <h1 className='text-2xl font-semibold text-gray-100'>{title}</h1>
        
            <div className='flex items-center gap-6'>
                <form onSubmit={handleSearch} className='flex items-center'>
                    <div className='relative'>
                        <Search className='absolute left-3 top-2.5 h-5 w-5 text-gray-400' />
                        <input
                            type='text'
                            placeholder='Search for something'
                            className='pl-10 pr-4 py-2 bg-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </form>

                <div className='flex gap-4'>
                    <Link to="/notifications" className='p-2 hover:bg-gray-700 rounded-full transition-colors'>
                    <Bell className='h-6 w-6 text-gray-300' />
                    </Link>
                    
                    <Link to="/settings" className='p-2 hover:bg-gray-700 rounded-full transition-colors'>
                    <UserCircle className='h-6 w-6 text-gray-300' />
                    </Link>
                </div>
            </div>
        </div>
    </header>
)
}

export default Header