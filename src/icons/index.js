import fs from 'fs'
import jimp from 'jimp'
import mime from 'mime'
import path from 'path'
import { joinURI } from '../helpers/uri'
import generateFingerprint from '../helpers/fingerprint'
import IconError from '../errors/IconError'

const supportedMimeTypes = [jimp.MIME_PNG, jimp.MIME_JPEG, jimp.MIME_BMP]

function parseArray (i) {
  return i && !Array.isArray(i) ? [i] : i
}

function sanitizeIcon (iconSnippet) {
  if (!iconSnippet.src) throw new IconError('Unknown icon source.')
  const arr = parseArray(iconSnippet.size || iconSnippet.sizes)
  if (!arr) throw new IconError('Unknown icon sizes.')
  const sizes = []
  for (let size of arr) {
    let width;
    let height;

    if (typeof size === 'string') {
      const matches = size.match(/(\d+)x(\d+)/);
      if (matches) {
        width = parseInt(matches[1]);
        height = parseInt(matches[2]);
      }
      else {
        width = parseInt(size);
        height = parseInt(size);
      }
    }
    else if (Array.isArray(size)) {
      width = typeof size[0] === 'string' ? parseInt(size[0]) : size[0];
      height = typeof size[1] === 'string' ? parseInt(size[1]) : size[1];
    }
    else {
      width = size;
      height = size;
    }

    if (!iconSnippet.preserve_aspect_ratio) {
      height = width;
    }

    sizes.push({width, height});
  }
  const icon = {
    src: iconSnippet.src,
    sizes,
    destination: iconSnippet.destination,
    ios: iconSnippet.ios || false,
    color: iconSnippet.color,
    purpose: iconSnippet.purpose,
    preserve_filename: iconSnippet.preserve_filename,
    preserve_aspect_ratio: iconSnippet.preserve_aspect_ratio
  };
  return icon;
}

function processIcon (currentSize, icon, buffer, mimeType, publicPath, shouldFingerprint) {
  const dimensions = `${currentSize.width}x${currentSize.height}`
  let fileNamePrefix;
  if (icon.preserve_filename) {
    const fileNameParsed = path.parse(icon.src);
    fileNamePrefix = fileNameParsed.name;
  }
  else {
    fileNamePrefix = `icon_${dimensions}`;
  }
  
  const fileName = shouldFingerprint ? `${fileNamePrefix}.${generateFingerprint(buffer)}.${mime.getExtension(mimeType)}` : `${fileNamePrefix}.${mime.getExtension(mimeType)}`
  const iconOutputDir = icon.destination ? joinURI(icon.destination, fileName) : fileName
  const iconPublicUrl = joinURI(publicPath, iconOutputDir)
  return {
    manifestIcon: {
      src: iconPublicUrl,
      sizes: dimensions,
      type: mimeType,
      purpose: icon.purpose
    },
    webpackAsset: {
      output: iconOutputDir,
      url: iconPublicUrl,
      source: buffer,
      size: buffer.length,
      ios: icon.ios ? { valid: icon.ios, size: dimensions, href: iconPublicUrl } : false,
      color: icon.color
    }
  }
}

function process (sizes, icon, cachedIconsCopy, icons, assets, fingerprint, publicPath, callback) {
  const processNext = function () {
    if (sizes.length > 0) {
      return process(sizes, icon, cachedIconsCopy, icons, assets, fingerprint, publicPath, callback) // next size
    } else if (cachedIconsCopy.length > 0) {
      const next = cachedIconsCopy.pop()
      return process(next.sizes, next, cachedIconsCopy, icons, assets, fingerprint, publicPath, callback) // next icon
    } else {
      return callback(null, { icons, assets }) // there are no more icons left
    }
  }

  const size = sizes.pop();
  if (size) {
    const mimeType = mime.getType(icon.src)
    if (!supportedMimeTypes.includes(mimeType)) {
      let buffer
      try {
        buffer = fs.readFileSync(icon.src)
      } catch (err) {
        throw new IconError(`It was not possible to read '${icon.src}'.`)
      }
      const processedIcon = processIcon(size, icon, buffer, mimeType, publicPath, fingerprint)
      icons.push(processedIcon.manifestIcon)
      assets.push(processedIcon.webpackAsset)
      return processNext()
    }

    jimp.read(icon.src, (err, img) => {
      if (err) throw new IconError(`It was not possible to read '${icon.src}'.`)
      if (icon.preserve_aspect_ratio) {
        img.scaleToFit(size.width, size.height).getBuffer(mimeType, (err, buffer) => {
          if (err) throw new IconError(`It was not possible to retrieve buffer of '${icon.src}'.`)
          const processedIcon = processIcon(size, icon, buffer, mimeType, publicPath, fingerprint)
          icons.push(processedIcon.manifestIcon)
          assets.push(processedIcon.webpackAsset)
          return processNext()
        });
      }
      else {
        img.resize(size.width, size.width).getBuffer(mimeType, (err, buffer) => {
          if (err) throw new IconError(`It was not possible to retrieve buffer of '${icon.src}'.`)
          const processedIcon = processIcon(size, icon, buffer, mimeType, publicPath, fingerprint)
          icons.push(processedIcon.manifestIcon)
          assets.push(processedIcon.webpackAsset)
          return processNext()
        });
      }
    })
  }
}

export function retrieveIcons (options) {
  const icons = parseArray(options.icon || options.icons)
  const response = []
  if (icons) for (let icon of icons) response.push(sanitizeIcon(icon))
  delete options.icon
  delete options.icons
  return response
}

export function parseIcons (fingerprint, publicPath, icons, callback) {
  if (icons.length === 0) {
    callback(null, {})
  } else {
    const first = icons.pop()
    process(first.sizes, first, icons, [], [], fingerprint, publicPath, callback)
  }
}
