"use client";

import React from "react";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { motion } from "framer-motion";
import { FaTrashAlt } from "react-icons/fa";

interface DeletePostButtonProps {
  postId: string;
}

const MySwal = withReactContent(Swal);

export function DeletePostButton({ postId }: DeletePostButtonProps) {
  const handleDelete = async () => {
    const result = await MySwal.fire({
      title: "Delete Post?",
      text: "Are you sure you want to delete this post?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#6C5CE7",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:8080/posts/delete?id=${postId}`, {
          withCredentials: true,
        });

        await MySwal.fire({
          title: "Deleted!",
          text: "The post has been deleted.",
          icon: "success",
          confirmButtonColor: "#6C5CE7",
        });

        window.location.reload();
      } catch (err: unknown) {
        console.log("Error deleting post:", err);
        MySwal.fire("Error", "Could not delete post.", "error");
      }
    }
  };

  return (
    <motion.button
      className="p-2 rounded-full text-red-600 hover:bg-red-50"
      onClick={handleDelete}
      initial={{ scale: 1 }}
      whileHover={{
        scale: 1.25,
        rotate: [0, -10, 10, -10, 10, 0],
        transition: {
          duration: 0.6,
          repeat: Infinity,
          repeatType: "loop",
        },
      }}
      whileTap={{ scale: 0.9, rotate: 0 }}
    >
      <FaTrashAlt className="w-5 h-5" />
    </motion.button>
  );
}
