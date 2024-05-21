export const getColorRange = (value: number, precision: number) => {
    const delta = 1 - precision;
    const max = Math.ceil(value * (1 + delta));
    const min = Math.floor(value * precision);
    return { min, max };
};

export const buildFilterColorsQuery = (colors: number[][], precision: number) =>
    colors.map((color) => {
        const red = getColorRange(color[0], precision);
        const green = getColorRange(color[1], precision);
        const blue = getColorRange(color[2], precision);

        return {
            $and: [
                {
                    $gte: [
                        {
                            $arrayElemAt: ['$$colors', 0],
                        },
                        red.min,
                    ],
                },
                {
                    $lte: [
                        {
                            $arrayElemAt: ['$$colors', 0],
                        },
                        red.max,
                    ],
                },

                {
                    $gte: [
                        {
                            $arrayElemAt: ['$$colors', 1],
                        },
                        green.min,
                    ],
                },
                {
                    $lte: [
                        {
                            $arrayElemAt: ['$$colors', 1],
                        },
                        green.max,
                    ],
                },

                {
                    $gte: [
                        {
                            $arrayElemAt: ['$$colors', 2],
                        },
                        blue.min,
                    ],
                },
                {
                    $lte: [
                        {
                            $arrayElemAt: ['$$colors', 2],
                        },
                        blue.max,
                    ],
                },
            ],
        };
    });

export const defaultFilterColors = [
    {
        $and: [
            {
                $gte: [
                    {
                        $arrayElemAt: ['$$colors', 0],
                    },
                    0,
                ],
            },
            {
                $lte: [
                    {
                        $arrayElemAt: ['$$colors', 0],
                    },
                    255,
                ],
            },

            {
                $gte: [
                    {
                        $arrayElemAt: ['$$colors', 1],
                    },
                    0,
                ],
            },
            {
                $lte: [
                    {
                        $arrayElemAt: ['$$colors', 1],
                    },
                    255,
                ],
            },

            {
                $gte: [
                    {
                        $arrayElemAt: ['$$colors', 2],
                    },
                    0,
                ],
            },
            {
                $lte: [
                    {
                        $arrayElemAt: ['$$colors', 2],
                    },
                    255,
                ],
            },
        ],
    },
];
