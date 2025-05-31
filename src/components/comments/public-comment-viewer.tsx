
'use client';

import type { Comment } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, UserCircle, Image as LucideImage } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image'; // Next.js Image component

interface PublicCommentViewerProps {
  comments: Comment[];
  maxHeight?: string;
}

export function PublicCommentViewer({ comments, maxHeight = '400px' }: PublicCommentViewerProps) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No hay comentarios aún. ¡Sé el primero!</p>;
  }

  return (
    <ScrollArea className="pr-3" style={{ height: maxHeight }}>
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id} className="overflow-hidden hover:shadow-md transition-shadow bg-card">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src={`https://avatar.vercel.sh/${comment.id}.png?size=32`} alt="User Avatar" />
                  <AvatarFallback><UserCircle className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed text-card-foreground">{comment.text}</p>
                  {comment.imageUrl && (
                    <div className="mt-2 border rounded-md overflow-hidden relative w-full aspect-video max-h-40 bg-muted">
                       <Image 
                         src={comment.imageUrl} 
                         alt="User submitted image" 
                         layout="fill" 
                         objectFit="contain" 
                         data-ai-hint="user report" 
                       />
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
  );
}
