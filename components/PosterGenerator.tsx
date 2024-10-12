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
import { Download } from 'lucide-react';
import NextImage from 'next/image';

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  subtitle: z.string().optional(),
  url: z.string().url({ message: "Invalid URL" }),
  image: z.any(),
  width: z.string().min(1, "Width must be a positive number").transform((val) => Number(val)),
  height: z.string().min(1, "Height must be a positive number").transform((val) => Number(val)),
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
      title: "00",
      subtitle: "新选项",
      url: "https://sharegpt-one.vercel.app/",
      width: "344",
      height: "444",
      image: null,
    },
  });

  const watchWidth = watch('width');
  const watchHeight = watch('height');

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const file = data.image[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setGeneratedPoster(true);
      };
      reader.readAsDataURL(file);
    } else {
      setGeneratedPoster(true);
    }
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
    if (generatedPoster && imagePreview) {
      const img = new Image();
      img.src = imagePreview;
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        let newWidth = Number(watchWidth);
        let newHeight = (newWidth / aspectRatio);

        if (newHeight > Number(watchHeight)) {
          newHeight = Number(watchHeight);
          newWidth = newHeight * aspectRatio;
        }

        setImageSize({ width: newWidth, height: newHeight });
      };
    }
  }, [generatedPoster, imagePreview, watchWidth, watchHeight]);

  return (
    <div className="flex flex-col w-full max-w-2xl gap-8">
      <h1 className="text-2xl font-bold">Magazine Style Poster Generator</h1>
      <div className="flex flex-col gap-4">
        {/* @ts-ignore */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-red-500">{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input id="subtitle" {...register('subtitle')} />
            {errors.subtitle && <p className="text-red-500">{errors.subtitle.message}</p>}
          </div>
          <div>
            <Label htmlFor="url">URL</Label>
            <Input id="url" {...register('url')} />
            {errors.url && <p className="text-red-500">{errors.url.message}</p>}
          </div>
          <div>
            <Label htmlFor="image">Image</Label>
            <Input id="image" type="file" {...register('image')} />
            {errors.image && <p className="text-red-500">{errors.image.message}</p>}
          </div>
          <div>
            <Label htmlFor="width">Width</Label>
            <Input id="width" type="number" {...register('width')} />
            {errors.width && <p className="text-red-500">{errors.width.message}</p>}
          </div>
          <div>
            <Label htmlFor="height">Height</Label>
            <Input id="height" type="number" {...register('height')} />
            {errors.height && <p className="text-red-500">{errors.height.message}</p>}
          </div>
          <Button type="submit">Generate Poster</Button>
        </form>
      </div>

      {generatedPoster && (
        <div className="mt-8">
          <div
            ref={posterRef}
            className="relative bg-white border border-gray-300 rounded-lg overflow-hidden"
            style={{ width: `${watchWidth}px`, height: `${watchHeight}px` }}
          >
            {imagePreview && (
              <Draggable
                nodeRef={imageRef}
                bounds="parent"
                position={imagePosition}
                onStop={(e, data) => setImagePosition({ x: data.x, y: data.y })}
              >
                <Resizable
                  size={imageSize}
                  onResizeStop={(e, direction, ref, d) => {
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
                    <NextImage src={imagePreview} alt="Uploaded" layout="fill" objectFit="cover" />
                  </div>
                </Resizable>
              </Draggable>
            )}
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
  );
}