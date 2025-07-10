
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Smile } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '👏',
    '🙌', '👐', '🤲', '🤜', '🤛', '✊', '👊', '🤚', '👋', '🤝',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '✨', '⭐', '🌟', '💫', '⚡', '💥', '💢', '💨', '💤', '💦',
    '🔥', '❄️', '☀️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️'
  ];

  const handleEmojiSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="p-2"
      >
        <Smile className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-h-96 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Escolher Emoji</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto">
              <div className="grid grid-cols-8 gap-2">
                {emojis.map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 text-lg hover:bg-gray-100"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default EmojiPicker;
