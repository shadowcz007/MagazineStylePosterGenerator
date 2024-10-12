"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import { Camera, Download } from 'lucide-react';
import Image from 'next/image';

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  subtitle: z.string().optional(),
  url: z.string().url({ message: "Invalid URL" }),
  image: z
    .any()
    .refine((files) => files?.length == 1, "Image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
  width: z.number().min(1, "Width must be a positive number"),
  height: z.number().min(1, "Height must be a positive number"),
});

export default function PosterGenerator() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedPoster, setGeneratedPoster] = useState<boolean>(false);
  const posterRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [titlePosition, setTitlePosition] = useState({ x: 20, y: 20 });
  const [subtitlePosition, setSubtitlePosition] = useState({ x: 20, y: 80 });
  const [qrCodePosition, setQrCodePosition] = useState({ x: 20, y: 140 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      url: "",
      width: 1080,
      height: 1920,
      image: null,
    },
  });

  const watchWidth = watch('width');
  const watchHeight = watch('height');

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const file = data.image[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new window.Image();
      img.src = reader.result as string;
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        let newWidth = watchWidth;
        let newHeight = newWidth / aspectRatio;

        if (newHeight > watchHeight) {
          newHeight = watchHeight;
          newWidth = newHeight * aspectRatio;
        }

        setImageSize({ width: newWidth, height: newHeight });
        setImagePreview(reader.result as string);
        setGeneratedPoster(true);
      };
    };
    reader.readAsDataURL(file);
  };

  const downloadPoster = () => {
    if (posterRef.current === null) {
      toast({
        title: "Error",
        description: "Could not generate poster. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toPng(posterRef.current, { cacheBust: true, })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'magazine-poster.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: "Could not download poster. Please try again.",
          variant: "destructive",
        });
      });
  };

  useEffect(() => {
    if (generatedPoster) {
      setTitlePosition({ x: 20, y: 20 });
      setSubtitlePosition({ x: 20, y: 80 });
      setQrCodePosition({ x: 20, y: watchHeight - 120 });
      setImagePosition({ x: 0, y: 0 });
    }
  }, [generatedPoster, watchHeight]);

  useEffect(() => {
    if (imagePreview) {
      const img = new window.Image();
      img.src = imagePreview;
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        let newWidth = watchWidth;
        let newHeight = newWidth / aspectRatio;

        if (newHeight > watchHeight) {
          newHeight = watchHeight;
          newWidth = newHeight * aspectRatio;
        }

        setImageSize({ width: newWidth, height: newHeight });
      };
    }
  }, [watchWidth, watchHeight, imagePreview]);

  return (
    <div className="flex w-full max-w-6xl gap-8">
      <div className="w-1/3">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} className="mt-1" />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message as string}</p>}
          </div>
          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input id="subtitle" {...register('subtitle')} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="url">URL</Label>
            <Input id="url" {...register('url')} className="mt-1" />
            {errors.url && <p className="text-red-500 text-sm mt-1">{errors.url.message as string}</p>}
          </div>
          <div>
            <Label htmlFor="image">Image</Label>
            <Input id="image" type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} {...register('image')} className="mt-1" />
            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image.message as string}</p>}
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="width">Width (px)</Label>
              <Input id="width" type="number" {...register('width')} className="mt-1" />
              {errors.width && <p className="text-red-500 text-sm mt-1">{errors.width.message as string}</p>}
            </div>
            <div className="flex-1">
              <Label htmlFor="height">Height (px)</Label>
              <Input id="height" type="number" {...register('height')} className="mt-1" />
              {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height.message as string}</p>}
            </div>
          </div>
          <Button type="submit" className="w-full">
            <Camera className="mr-2 h-4 w-4" /> Generate Poster
          </Button>
        </form>
      </div>

      <div className="w-2/3">
        {generatedPoster && (
          <div className="mt-8">
            <div
              ref={posterRef}
              className="relative bg-white border border-gray-300 rounded-lg overflow-hidden"
              style={{ width: `${watchWidth}px`, height: `${watchHeight}px` }}>

              <Draggable
                nodeRef={imageRef}
                bounds="parent"
                position={imagePosition}
                onStop={(e, data) => setImagePosition({ x: data.x, y: data.y })}
              >
                <Resizable
                  size={{ width: imageSize.width, height: imageSize.height }}
                  onResizeStop={(e: MouseEvent | TouchEvent, direction: string, ref: HTMLElement, d: { width: number, height: number }) => {
                    setImageSize({
                      width: imageSize.width + d.width,
                      height: imageSize.height + d.height
                    });
                  }}
                  minWidth={100}
                  minHeight={100}
                  maxWidth={watchWidth}
                  maxHeight={watchHeight}
                >
                  <div ref={imageRef} className="cursor-move">
                    <Image src={imagePreview as string} alt="Uploaded" layout="fill" objectFit="cover" />
                  </div>
                </Resizable>
              </Draggable>

              <Draggable
                nodeRef={titleRef}
                bounds="parent"
                position={titlePosition}
                onStop={(e, data) => setTitlePosition({ x: data.x, y: data.y })}
              >
                <h1
                  ref={titleRef}
                  className="absolute text-6xl font-bold cursor-move"
                  style={{ color: '#fff', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}
                >
                  {watch('title')}
                </h1>
              </Draggable>

              <Draggable
                nodeRef={subtitleRef}
                bounds="parent"
                position={subtitlePosition}
                onStop={(e, data) => setSubtitlePosition({ x: data.x, y: data.y })}
              >
                <h2
                  ref={subtitleRef}
                  className="absolute text-3xl font-semibold cursor-move"
                  style={{ color: '#fff', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}
                >
                  {watch('subtitle')}
                </h2>
              </Draggable>

              <Draggable
                nodeRef={qrCodeRef}
                bounds="parent"
                position={qrCodePosition}
                onStop={(e, data) => setQrCodePosition({ x: data.x, y: data.y })}
              >
                <div
                  ref={qrCodeRef}
                  className="absolute cursor-move p-2 bg-white bg-opacity-50 rounded"
                >
                  <QRCodeSVG value={watch('url')} size={100} />
                </div>
              </Draggable>
            </div>
            <Button onClick={downloadPoster} className="mt-4 w-full">
              <Download className="mr-2 h-4 w-4" /> Download Poster
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
