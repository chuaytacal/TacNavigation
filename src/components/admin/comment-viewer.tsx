'use client';

import type { Comment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Image as ImageIcon, MapPin, UserCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

interface CommentViewerProps {
  comments: Comment[];
}

export function CommentViewer({ comments }: CommentViewerProps) {
  return (
    <Card className="w-full max-w-2xl shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
            <MessageSquare className="mr-2 h-6 w-6 text-primary" /> User Reported Issues
        </CardTitle>
        <CardDescription>Review comments and reports submitted by users.</CardDescription>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No comments submitted yet.</p>
        ) : (
          <ScrollArea className="h-[400px] pr-3">
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar>
                        <AvatarImage src={`https://avatar.vercel.sh/${comment.id}.png`} alt="User Avatar" />
                        <AvatarFallback><UserCircle /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{comment.text}</p>
                        {comment.imageUrl && (
                          <div className="mt-2 border rounded-md overflow-hidden relative w-full aspect-video max-h-48 bg-muted">
                             <Image src={comment.imageUrl} alt="User submitted image" layout="fill" objectFit="contain" data-ai-hint="user report" />
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(comment.submittedAt), { addSuffix: true })}
                          </span>
                          {comment.coordinates && (
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {comment.coordinates.lat.toFixed(3)}, {comment.coordinates.lng.toFixed(3)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
