"use client";
// Only needed if you're on Next.js 13 App Router with TypeScript; remove otherwise.

import React, { useState, useRef } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Box,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
  Divider,
  Button,
  styled,
} from "@mui/material";

import {
  // We remove VideocamIcon & CallIcon so they won't appear in the header
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Send as SendIcon,
  Add as AddIcon,
  InsertEmoticon as InsertEmoticonIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Notifications as NotificationsIcon,
  Group as GroupIcon,
  Chat as ChatIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";

/** Emoji picker library */
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

/**
 * Chat bubble component: pastel purple for outgoing, light gray for incoming.
 */
const MessageBubble = styled("div")<{ outgoing?: boolean }>(({ outgoing }) => ({
  maxWidth: "60%",
  padding: "10px 14px",
  borderRadius: 16,
  marginBottom: 8,
  color: outgoing ? "#fff" : "#333",
  backgroundColor: outgoing ? "#9b51e0" : "#f2f2f2",
  alignSelf: outgoing ? "flex-end" : "flex-start",
}));

export default function ChatOnnExactPage() {
  // Left sidebar chat list
  const [chats] = useState([
    {
      name: "Habib Mansoor ",
      message: "Are we meeting today? Let's discuss the plan!",
      time: "3:24 PM",
      avatar: "https://i.pravatar.cc/40?img=1",
    },
    {
      name: "Ali Hassan ",
      message: "I've mailed you the files. Check it out.",
      time: "2:23 PM",
      avatar: "https://i.pravatar.cc/40?img=2",
    },
    {
      name: "Husain jaafar",
      message: "Last night party was awesome :D",
      time: "1:15 PM",
      avatar: "https://i.pravatar.cc/40?img=3",
    },
    {
      name: "Mohd Alasfoor",
      message: "Are you there ??",
      time: "10:00 AM",
      avatar: "https://i.pravatar.cc/40?img=4",
    },
    {
      name: "Ehab ",
      message: "Bro, I need your help. Call me soon.",
      time: "9:50 AM",
      avatar: "https://i.pravatar.cc/40?img=5",
    },
  ]);

  // For filtering the chat list
  const [searchTerm, setSearchTerm] = useState("");

  // Filter chats by name or message
  const filteredChats = chats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Default: "Mohd Alasfoor" is selected
  const [selectedChat, setSelectedChat] = useState(chats[3]);

  // Center chat messages
  const [messages, setMessages] = useState([
    { text: "Hey! Listen", outgoing: false },
    {
      text: "I really like your idea, but I still think we can do more in this",
      outgoing: false,
    },
    { text: "I will share something", outgoing: false },
    {
      text: "Let's together work on this n create something more awesome.",
      outgoing: false,
    },
    { text: "Sounds perfect", outgoing: true },
  ]);

  // Right sidebar data
  const [notifications] = useState([
    { text: "@Ankita mentioned you in 'Trip to Goa' - 1m ago" },
    { text: "@rakeshSingh added you in group 'Study' - 5m ago" },
    { text: "@nituRah removed you from group 'Riders' - 8m ago" },
    { text: "@amit mentioned you in 'Public chat' - 12m ago" },
    { text: "@Ankita mentioned you in 'College Gang' - 15m ago" },
    { text: "@VikashSingh added you in group 'Designers' - 20m ago" },
  ]);
  const [suggestions] = useState([
    { name: "Abhinam Singh", mutual: "12 Mutuals", avatar: "https://i.pravatar.cc/30?img=6" },
    { name: "Ved Prakash", mutual: "5 Mutuals", avatar: "https://i.pravatar.cc/30?img=7" },
    { name: "Amit Trivedi", mutual: "8 Mutuals", avatar: "https://i.pravatar.cc/30?img=8" },
    { name: "Vikash Raj", mutual: "2 Mutuals", avatar: "https://i.pravatar.cc/30?img=9" },
  ]);

  // For new message, emoji, file/image
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Refs for hidden file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Send a new message
  const handleSend = () => {
    if (!newMessage.trim()) return;
    setMessages((prev) => [...prev, { text: newMessage, outgoing: true }]);
    setNewMessage("");
  };

  // Toggle the emoji picker
  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  // When selecting an emoji
  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  // Attach a file
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMessages((prev) => [...prev, { text: `File uploaded: ${file.name}`, outgoing: true }]);
      e.target.value = "";
    }
  };

  // Attach an image
  const handleImageClick = () => {
    imageInputRef.current?.click();
  };
  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const imgFile = e.target.files?.[0];
    if (imgFile) {
      setMessages((prev) => [...prev, { text: `Image uploaded: ${imgFile.name}`, outgoing: true }]);
      e.target.value = "";
    }
  };

  return (
    <Box sx={{ height: "100vh", width: "100vw", backgroundColor: "#f9f9f9", overflow: "hidden" }}>
      {/* Top navbar (AppBar) with "Chat ONN" brand + icons */}
      <AppBar
        position="static"
        sx={{
          backgroundColor: "#fff",
          color: "#333",
          boxShadow: "none",
          borderBottom: "1px solid #eee",
          zIndex: 10,
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* Left: Brand Name */}
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Social Chat 
          </Typography>

          {/* Middle icons (unchanged) */}
          <Box sx={{ display: "flex", gap: 3 }}>
            <IconButton>
              <ChatIcon sx={{ color: "#9b51e0" }} />
            </IconButton>
            <IconButton>
              <GroupIcon sx={{ color: "#9b51e0" }} />
            </IconButton>
            <IconButton>
              <NotificationsIcon sx={{ color: "#9b51e0" }} />
            </IconButton>
            <IconButton>
              <Avatar src="https://i.pravatar.cc/40?img=10" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Grid container sx={{ height: "calc(100vh - 64px)" }}>
        {/* LEFT SIDEBAR */}
        <Grid
          item
          xs={3}
          sx={{
            backgroundColor: "#fff",
            borderRight: "1px solid #eee",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* "Chats" header with the category tabs and a plus icon */}
          <Box sx={{ px: 3, py: 2 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
              Chats
            </Typography>

            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: "#9b51e0", cursor: "pointer" }}>
                Direct
              </Typography>
              <Typography variant="subtitle2" sx={{ color: "#bdbdbd", cursor: "pointer" }}>
                Groups
              </Typography>
              <Typography variant="subtitle2" sx={{ color: "#bdbdbd", cursor: "pointer" }}>
                Public
              </Typography>
              <Box sx={{ flex: 1 }} />
              <IconButton>
                <AddIcon sx={{ color: "#9b51e0" }} />
              </IconButton>
            </Box>

            {/* Search input: now updates searchTerm */}
            <Box
              sx={{
                backgroundColor: "#f2f2f2",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                px: 2,
              }}
            >
              <SearchIcon sx={{ color: "#aaa" }} />
              <TextField
                variant="standard"
                placeholder="Search"
                InputProps={{ disableUnderline: true }}
                sx={{ ml: 1, flex: 1 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Box>
          </Box>

          {/* Chat list - now we map over filteredChats */}
          <List sx={{ flex: 1, overflowY: "auto" }}>
            {filteredChats.map((chat, idx) => {
              const isSelected = chat.name === selectedChat.name;
              return (
                <ListItem disablePadding key={idx}>
                  <ListItemButton
                    onClick={() => setSelectedChat(chat)}
                    sx={{
                      borderRadius: 2,
                      mx: 1,
                      mb: 1,
                      backgroundColor: isSelected ? "#2f2e41" : "transparent",
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={chat.avatar} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body1"
                          sx={{
                            color: isSelected ? "#fff" : "#333",
                            fontWeight: isSelected ? "bold" : 400,
                          }}
                        >
                          {chat.name}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          sx={{ color: isSelected ? "#fff" : "#999" }}
                        >
                          {chat.message}
                        </Typography>
                      }
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: isSelected ? "#fff" : "#999",
                        ml: 1,
                        minWidth: 40,
                        textAlign: "right",
                      }}
                    >
                      {chat.time}
                    </Typography>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Grid>

        {/* CENTER CHAT AREA */}
        <Grid item xs={6} sx={{ backgroundColor: "#fff", display: "flex", flexDirection: "column", position: "relative" }}>
          {/* Chat Header: no call/video icons */}
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid #eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar src={selectedChat.avatar} sx={{ width: 50, height: 50 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  {selectedChat.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "#999" }}>
                  Last seen 3 hours ago
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <IconButton>
                <MoreVertIcon sx={{ color: "#9b51e0" }} />
              </IconButton>
            </Box>
          </Box>

          {/* Messages area */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2, overflowY: "auto", gap: 1 }}>
            <Typography variant="caption" sx={{ color: "#999", alignSelf: "center", mb: 2 }}>
              Today 12:21 AM
            </Typography>
            {messages.map((msg, idx) => (
              <Box key={idx} sx={{ display: "flex", justifyContent: msg.outgoing ? "flex-end" : "flex-start" }}>
                <MessageBubble outgoing={msg.outgoing}>{msg.text}</MessageBubble>
              </Box>
            ))}
          </Box>

          {/* Hidden file inputs for attachments & images */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileSelected}
          />
          <input
            type="file"
            accept="image/*"
            ref={imageInputRef}
            style={{ display: "none" }}
            onChange={handleImageSelected}
          />

          {/* The Emoji Picker, shown if showEmojiPicker is true */}
          {showEmojiPicker && (
            <Box
              sx={{
                position: "absolute",
                bottom: 70,
                left: 20,
                zIndex: 999,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </Box>
          )}

          {/* Chat input row */}
          <Box sx={{ p: 2, borderTop: "1px solid #eee", display: "flex", alignItems: "center" }}>
            {/* InsertEmoticon => toggles emoji picker */}
            <IconButton onClick={toggleEmojiPicker}>
              <InsertEmoticonIcon sx={{ color: "#9b51e0" }} />
            </IconButton>

            {/* Attach file => triggers hidden file input */}
            <IconButton onClick={handleAttachClick}>
              <AttachFileIcon sx={{ color: "#9b51e0" }} />
            </IconButton>

            {/* Attach image => triggers hidden image input */}
            <IconButton onClick={handleImageClick}>
              <ImageIcon sx={{ color: "#9b51e0" }} />
            </IconButton>

            {/* TextField for the message */}
            <TextField
              variant="outlined"
              placeholder="Type a message here..."
              fullWidth
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              sx={{ mx: 2 }}
            />

            {/* Send button in a circle */}
            <IconButton
              onClick={handleSend}
              sx={{
                backgroundColor: "#9b51e0",
                color: "#fff",
                "&:hover": { backgroundColor: "#a964e2" },
                borderRadius: "50%",
                width: 48,
                height: 48,
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Grid>

        {/* RIGHT SIDEBAR: Notifications + Suggestions (unchanged) */}
        <Grid item xs={3} sx={{ backgroundColor: "#fff", display: "flex", flexDirection: "column" }}>
          {/* Notifications */}
          <Box sx={{ px: 2, py: 3, borderBottom: "1px solid #eee" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Notifications
            </Typography>
            {notifications.map((n, i) => (
              <Typography key={i} variant="body2" sx={{ color: "#333", mb: 1 }}>
                {n.text}
              </Typography>
            ))}
          </Box>

          {/* Suggestions */}
          <Box sx={{ px: 2, py: 3, overflowY: "auto" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Suggestions
            </Typography>
            {suggestions.map((sugg, idx) => (
              <Box
                key={idx}
                sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar src={sugg.avatar} sx={{ width: 36, height: 36 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {sugg.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#999" }}>
                      {sugg.mutual}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAddIcon />}
                  sx={{
                    backgroundColor: "#9b51e0",
                    "&:hover": { backgroundColor: "#a964e2" },
                    textTransform: "none",
                  }}
                >
                  Add
                </Button>
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
