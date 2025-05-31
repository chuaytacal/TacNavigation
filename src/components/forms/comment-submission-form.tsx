'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { submitCommentAction } from '@/lib/actions';
import type { CommentFormData } from '@/lib/types';
import { Send, ImageUp, MapPin, Loader2 } from 'lucide-react';
import Image from 'next/image';

const commentFormSchema = z.object({
  text: z.string().min(10, { message: "Comment must be at least 10 characters long." }).max(500),
  image: z.instanceof(File).optional().refine(file => !file || file.size <= 5 * 1024 * 1024, `Max file size is 5MB.`).refine(file => !file || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type), '.jpg, .png, and .webp files are accepted.'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

export function CommentSubmissionForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      text: '',
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue('image', undefined);
      setPreviewImage(null);
    }
  };
  
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          form.setValue('latitude', latitude);
          form.setValue('longitude', longitude);
          toast({ title: "Location captured", description: "Your current location has been attached to the comment." });
        },
        (error) => {
          toast({ variant: "destructive", title: "Location Error", description: "Could not get your location. Please ensure location services are enabled." });
          console.error("Error getting location:", error);
        }
      );
    } else {
      toast({ variant: "destructive", title: "Location Error", description: "Geolocation is not supported by your browser." });
    }
  };


  const onSubmit: SubmitHandler<CommentFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const formData: CommentFormData = {
        text: data.text,
        image: data.image,
        latitude: data.latitude,
        longitude: data.longitude,
      };
      
      await submitCommentAction(formData);

      toast({
        title: 'Comment Submitted!',
        description: 'Thank you for your feedback. The municipality will review your comment.',
      });
      form.reset();
      setPreviewImage(null);
      setCurrentLocation(null);
      if(fileInputRef.current) fileInputRef.current.value = "";

    } catch (error) {
      console.error('Failed to submit comment:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'There was an error submitting your comment. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Report Traffic Issue</CardTitle>
        <CardDescription>Share information about traffic conditions or road obstructions.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="commentText">Your Comment</FormLabel>
                  <FormControl>
                    <Textarea
                      id="commentText"
                      placeholder="Describe the traffic issue, e.g., 'Accident on Av. Principal causing delays...'"
                      rows={4}
                      {...field}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="commentImage">Attach Photo (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      id="commentImage" 
                      type="file" 
                      accept="image/png, image/jpeg, image/webp" 
                      onChange={handleImageChange}
                      ref={fileInputRef}
                      className="file:text-primary file:font-semibold"
                    />
                  </FormControl>
                  <FormMessage />
                  {previewImage && (
                    <div className="mt-2 relative w-full h-40 rounded border overflow-hidden">
                       <Image src={previewImage} alt="Preview" layout="fill" objectFit="contain" data-ai-hint="uploaded image"/>
                    </div>
                  )}
                </FormItem>
              )}
            />
            <Button type="button" variant="outline" onClick={getCurrentLocation} className="w-full">
              <MapPin className="mr-2 h-4 w-4" /> {currentLocation ? `Location Captured (${currentLocation.lat.toFixed(3)}, ${currentLocation.lng.toFixed(3)})` : "Attach Current Location"}
            </Button>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Comment
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
