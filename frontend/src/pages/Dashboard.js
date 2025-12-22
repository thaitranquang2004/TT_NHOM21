import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Chats from './Chats';
import Friends from './Friends';
import Profile from './Profile';
import ChatWindow from './ChatWindow';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [activeChatId, setActiveChatId] = useState(null);

  const handleSelectChat = (chatId) => {
    setActiveTab('chats');
    setActiveChatId(chatId);
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="dashboard-content">
        {activeTab === 'chats' && (
            <div className="chats-view">
                <Chats onSelectChat={handleSelectChat} activeChatId={activeChatId} />
                <div className="chat-window-container">
                    {activeChatId ? (
                        <ChatWindow chatId={activeChatId} />
                    ) : (
                        <div className="welcome-screen">
                            <h2>Welcome to Band M</h2>
                            <p>Select a chat to start messaging</p>
                        </div>
                    )}
                </div>
            </div>
        )}
        
        {activeTab === 'friends' && (
            <div className="friends-view">
                <Friends onSelectChat={handleSelectChat} />
            </div>
        )}
        
        {activeTab === 'profile' && (
            <div className="profile-view" style={{ display: 'flex',justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
                <Profile />
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
