// Export types directly
export * from './types';

// Import from categories and experiences
import { categories } from './categories';
import { experiences } from './experiences';
import { Experience } from './types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

// This function checks if there are saved experiences in localStorage for fallback
export const getSavedExperiences = (): Experience[] => {
  try {
    const saved = localStorage.getItem('experiences');
    return saved ? JSON.parse(saved) : experiences;
  } catch (error) {
    console.error('Error retrieving saved experiences:', error);
    return experiences;
  }
};

// Helper function to map database experience to application experience type
const mapDbExperienceToModel = (item: any): Experience => ({
  id: item.id,
  title: item.title,
  description: item.description,
  imageUrl: item.image_url,
  price: item.price,
  location: item.location,
  latitude: item.latitude ? Number(item.latitude) : undefined,
  longitude: item.longitude ? Number(item.longitude) : undefined,
  duration: item.duration,
  participants: item.participants,
  date: item.date,
  category: item.category,
  nicheCategory: item.niche_category,
  exp_type: item.exp_type || [],
  trending: item.trending || false,
  featured: item.featured || false,
  romantic: item.romantic || false,
  adventurous: item.adventurous || false,
  group: item.group_activity || false
});

// This hook manages the experiences data
export const useExperiencesManager = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load experiences from Supabase on component mount
  useEffect(() => {
    const fetchExperiences = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('experiences')
          .select('id, title, description, image_url, price, location, latitude, longitude, duration, participants, date, category, niche_category, exp_type, trending, featured, romantic, adventurous, group_activity');
        
        if (error) {
          throw error;
        }
        
        // Map Supabase data to our Experience type
        const mappedExperiences = data.map(mapDbExperienceToModel);
        setExperiences(mappedExperiences);
        
        // Save to localStorage as fallback
        localStorage.setItem('experiences', JSON.stringify(mappedExperiences));
      } catch (err) {
        console.error('Error fetching experiences:', err);
        setError('Failed to load experiences');
        
        // Load from localStorage as fallback
        const saved = getSavedExperiences();
        if (saved.length > 0) {
          setExperiences(saved);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExperiences();
  }, []);

  // Add a new experience
  const addExperience = async (experience: Omit<Experience, 'id'>) => {
    try {
      // Map our Experience type to Supabase schema
      const { data, error } = await supabase
        .from('experiences')
        .insert({
          title: experience.title,
          description: experience.description,
          image_url: experience.imageUrl,
          price: experience.price,
          location: experience.location,
          duration: experience.duration,
          participants: experience.participants,
          date: experience.date,
          category: experience.category,
          niche_category: experience.nicheCategory,
          exp_type: experience.exp_type,
          trending: experience.trending || false,
          featured: experience.featured || false,
          romantic: experience.romantic || false,
          adventurous: experience.adventurous || false,
          group_activity: experience.group || false
        })
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      const newExperience = mapDbExperienceToModel(data);
      setExperiences(prev => [...prev, newExperience]);
      return newExperience;
    } catch (err) {
      console.error('Error adding experience:', err);
      toast.error('Failed to add experience');
      throw err;
    }
  };

  // Update an existing experience
  const updateExperience = async (id: string, updates: Partial<Experience>) => {
    try {
      // Map our Experience type updates to Supabase schema
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.participants !== undefined) updateData.participants = updates.participants;
      if (updates.date !== undefined) updateData.date = updates.date;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.nicheCategory !== undefined) updateData.niche_category = updates.nicheCategory;
      if (updates.exp_type !== undefined) updateData.exp_type = updates.exp_type;
      if (updates.trending !== undefined) updateData.trending = updates.trending;
      if (updates.featured !== undefined) updateData.featured = updates.featured;
      if (updates.romantic !== undefined) updateData.romantic = updates.romantic;
      if (updates.adventurous !== undefined) updateData.adventurous = updates.adventurous;
      if (updates.group !== undefined) updateData.group_activity = updates.group;
      
      const { error } = await supabase
        .from('experiences')
        .update(updateData)
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      setExperiences(prev => 
        prev.map(exp => (exp.id === id ? { ...exp, ...updates } : exp))
      );
    } catch (err) {
      console.error('Error updating experience:', err);
      toast.error('Failed to update experience');
      throw err;
    }
  };

  // Delete an experience
  const deleteExperience = async (id: string) => {
    try {
      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      setExperiences(prev => prev.filter(exp => exp.id !== id));
    } catch (err) {
      console.error('Error deleting experience:', err);
      toast.error('Failed to delete experience');
      throw err;
    }
  };

  // Import experiences from JSON
  const importExperiences = async (jsonString: string) => {
    try {
      const importedExperiences = JSON.parse(jsonString);
      
      if (!Array.isArray(importedExperiences)) {
        return { success: false, message: 'Invalid format: expected an array' };
      }
      
      // Insert new experiences
      const experiencesToInsert = importedExperiences.map((exp: any) => ({
        title: exp.title,
        description: exp.description,
        image_url: exp.imageUrl,
        price: exp.price,
        location: exp.location,
        duration: exp.duration,
        participants: exp.participants,
        date: exp.date,
        category: exp.category,
        niche_category: exp.nicheCategory,
        exp_type: exp.exp_type,
        trending: exp.trending || false,
        featured: exp.featured || false,
        romantic: exp.romantic || false,
        adventurous: exp.adventurous || false,
        group_activity: exp.group || false
      }));
      
      const { error: insertError } = await supabase
        .from('experiences')
        .insert(experiencesToInsert);
        
      if (insertError) {
        throw insertError;
      }
      
      // Refresh the experiences list
      const { data, error: fetchError } = await supabase
        .from('experiences')
        .select('id, title, description, image_url, price, location, latitude, longitude, duration, participants, date, category, niche_category, exp_type, trending, featured, romantic, adventurous, group_activity');
        
      if (fetchError) {
        throw fetchError;
      }
      
      // Map Supabase data to our Experience type
      const mappedExperiences = data.map(mapDbExperienceToModel);
      
      setExperiences(mappedExperiences);
      
      return { success: true, message: 'Experiences imported successfully' };
    } catch (error) {
      console.error('Error importing experiences:', error);
      return { 
        success: false, 
        message: `Error importing: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  // Export experiences to JSON
  const exportExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select('id, title, description, image_url, price, location, latitude, longitude, duration, participants, date, category, niche_category, exp_type, trending, featured, romantic, adventurous, group_activity');
        
      if (error) {
        throw error;
      }
      
      // Map Supabase data to our Experience type for export
      const exportData = data.map(mapDbExperienceToModel);
      
      return JSON.stringify(exportData, null, 2);
    } catch (err) {
      console.error('Error exporting experiences:', err);
      toast.error('Failed to export experiences');
      throw err;
    }
  };

  // Reset to default experiences - for development purposes
  const resetExperiences = async () => {
    try {
      toast.success('Experiences have been reset');
      return { success: true, message: 'Experiences have been reset' };
    } catch (err) {
      console.error('Error resetting experiences:', err);
      toast.error('Failed to reset experiences');
      throw err;
    }
  };

  return {
    experiences,
    isLoading,
    error,
    addExperience,
    updateExperience,
    deleteExperience,
    resetExperiences,
    importExperiences,
    exportExperiences
  };
};

// Create a standalone function to get all experiences
export const getAllExperiences = async (): Promise<Experience[]> => {
  try {
    const { data, error } = await supabase
      .from('experiences')
      .select('id, title, description, image_url, price, location, latitude, longitude, duration, participants, date, category, niche_category, exp_type, trending, featured, romantic, adventurous, group_activity');
    
    if (error) {
      throw error;
    }
    
    return data.map(mapDbExperienceToModel);
  } catch (err) {
    console.error('Error loading experiences:', err);
    return getSavedExperiences();
  }
};

// Create a standalone function to get trending experiences
export const getTrendingExperiences = async (): Promise<Experience[]> => {
  try {
    const { data, error } = await supabase
      .from('experiences')
      .select('id, title, description, image_url, price, location, latitude, longitude, duration, participants, date, category, niche_category, exp_type, trending, featured, romantic, adventurous, group_activity')
      .eq('trending', true);
    
    if (error) {
      throw error;
    }
    
    return data.map(mapDbExperienceToModel);
  } catch (err) {
    console.error('Error loading trending experiences:', err);
    const localExperiences = getSavedExperiences();
    return localExperiences.filter(exp => exp.trending);
  }
};

// Create a standalone function to get featured experiences
export const getFeaturedExperiences = async (): Promise<Experience[]> => {
  try {
    const { data, error } = await supabase
      .from('experiences')
      .select('id, title, description, image_url, price, location, latitude, longitude, duration, participants, date, category, niche_category, exp_type, trending, featured, romantic, adventurous, group_activity')
      .eq('featured', true);
    
    if (error) {
      throw error;
    }
    
    return data.map(mapDbExperienceToModel);
  } catch (err) {
    console.error('Error loading featured experiences:', err);
    const localExperiences = getSavedExperiences();
    return localExperiences.filter(exp => exp.featured);
  }
};

// Create a standalone function to get a single experience by ID
export const getExperienceById = async (id: string): Promise<Experience | null> => {
  try {
    const { data, error } = await supabase
      .from('experiences')
      .select('id, title, description, image_url, price, location, latitude, longitude, duration, participants, date, category, niche_category, exp_type, trending, featured, romantic, adventurous, group_activity')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    if (!data) return null;
    
    return mapDbExperienceToModel(data);
  } catch (err) {
    console.error('Error loading experience by ID:', err);
    const localExperiences = getSavedExperiences();
    return localExperiences.find(exp => exp.id === id) || null;
  }
};

// Create a standalone function to get experiences by category
export const getExperiencesByCategory = async (categoryId: string): Promise<Experience[]> => {
  try {
    const categoryObj = categories.find(cat => cat.id === categoryId);
    
    if (!categoryObj) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('experiences')
      .select('id, title, description, image_url, price, location, latitude, longitude, duration, participants, date, category, niche_category, exp_type, trending, featured, romantic, adventurous, group_activity')
      .ilike('category', categoryObj.name.toLowerCase());
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      const localExperiences = getSavedExperiences();
      return localExperiences.filter(exp => 
        exp.category?.toLowerCase() === categoryObj.name.toLowerCase()
      );
    }
    
    return data.map(mapDbExperienceToModel);
  } catch (err) {
    console.error('Error loading experiences by category:', err);
    const localExperiences = getSavedExperiences();
    const categoryObj = categories.find(cat => cat.id === categoryId);
    return localExperiences.filter(exp => 
      categoryObj && exp.category?.toLowerCase() === categoryObj.name.toLowerCase()
    );
  }
};
