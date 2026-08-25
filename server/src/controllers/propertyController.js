import * as propertyService from "../services/propertyService.js";
import * as propertyImageModel from "../models/propertyImageModel.js";
import * as bookingService from "../services/bookingService.js";
import AppError from "../utils/AppError.js";

function mapPayload(body) {
  return {
    title: body.title,
    description: body.description,
    rentalType: body.rental_type,
    address: body.address,
    city: body.city,
    postalCode: body.postal_code,
    floor: body.floor,
    sqm: body.sqm,
    numRooms: body.num_rooms,
    numBathrooms: body.num_bathrooms,
    furnishings: body.furnishings,
    monthlyPrice: body.monthly_price,
    deposit: body.deposit,
    availableFrom: body.available_from,
    isPublished: body.is_published,
  };
}

export async function create(req, res, next) {
  try {
    const property = await propertyService.createProperty(req.user.id, mapPayload(req.body));
    res.status(201).json({ property });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const property = await propertyService.updateProperty(
      Number(req.params.id),
      req.user.id,
      mapPayload(req.body)
    );
    res.json({ property });
  } catch (err) {
    next(err);
  }
}

export async function setPublished(req, res, next) {
  try {
    const property = await propertyService.setPublished(
      Number(req.params.id),
      req.user.id,
      Boolean(req.body.is_published)
    );
    res.json({ property });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await propertyService.deleteProperty(Number(req.params.id), req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function search(req, res, next) {
  try {
    const properties = await propertyService.searchProperties(req.query);
    res.json({ properties });
  } catch (err) {
    next(err);
  }
}

export async function getMine(req, res, next) {
  try {
    const properties = await propertyService.listOwnerProperties(req.user.id);
    res.json({ properties });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const property = await propertyService.getProperty(Number(req.params.id));
    const images = await propertyImageModel.findByProperty(property.id);
    res.json({ property, images });
  } catch (err) {
    next(err);
  }
}

export async function getAvailability(req, res, next) {
  try {
    const availability = await bookingService.getAvailability(Number(req.params.id));
    res.json(availability);
  } catch (err) {
    next(err);
  }
}

export async function uploadImages(req, res, next) {
  try {
    const propertyId = Number(req.params.id);
    await propertyService.getOwnerProperty(propertyId, req.user.id);

    if (!req.files || !req.files.length) {
      throw new AppError(400, "NO_FILES", "Nessuna immagine caricata");
    }

    const existingCount = await propertyImageModel.countByProperty(propertyId);
    const images = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const image = await propertyImageModel.create({
        propertyId,
        url: `/uploads/${file.filename}`,
        sortOrder: existingCount + i,
      });
      images.push(image);
    }

    res.status(201).json({ images });
  } catch (err) {
    next(err);
  }
}

export async function deleteImage(req, res, next) {
  try {
    const propertyId = Number(req.params.id);
    await propertyService.getOwnerProperty(propertyId, req.user.id);

    const image = await propertyImageModel.findById(Number(req.params.imageId));
    if (!image || image.property_id !== propertyId) {
      throw new AppError(404, "IMAGE_NOT_FOUND", "Immagine non trovata");
    }

    await propertyImageModel.remove(image.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function reorderImages(req, res, next) {
  try {
    const propertyId = Number(req.params.id);
    await propertyService.getOwnerProperty(propertyId, req.user.id);

    const order = req.body.order;
    if (!Array.isArray(order)) {
      throw new AppError(400, "INVALID_ORDER", "Formato ordine non valido");
    }

    for (const { id, sort_order } of order) {
      await propertyImageModel.updateSortOrder(id, sort_order);
    }

    const images = await propertyImageModel.findByProperty(propertyId);
    res.json({ images });
  } catch (err) {
    next(err);
  }
}
